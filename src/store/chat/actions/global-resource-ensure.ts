import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  GLOBAL_BADGE_SLICE_KEYS,
  GLOBAL_EMOTE_SLICE_KEYS,
  mapSlices,
} from '../types/chat-resource-slices';
import { isGlobalCacheStale } from './channel-refresh-plan';
import {
  type BadgeCacheKey,
  buildGlobalBadgeResourceSpecs,
  buildGlobalEmoteResourceSpecs,
  type EmoteCacheKey,
  globalChatResourceGuard,
  reconcileSettledSpecs,
  reportResourceResults,
  type SettledSpec,
  settleSpecs,
} from './channel-resources';

const GUARD_KEY = 'globalChatResources';

export type GlobalSettledSpec =
  | SettledSpec<EmoteCacheKey, SanitisedEmote>
  | SettledSpec<BadgeCacheKey, SanitisedBadgeSet>;

/**
 * The freshness stamp only advances when every global fetch succeeded, so a
 * failed slice keeps its retry pressure.
 */
function writeGlobalResults(
  emoteSettled: SettledSpec<EmoteCacheKey, SanitisedEmote>[],
  badgeSettled: SettledSpec<BadgeCacheKey, SanitisedBadgeSet>[],
): void {
  const existing = chatStore$.persisted.globalCaches.peek();

  const context = {
    channelId: '',
    existingCache: undefined,
    existingGlobalCache: existing,
  };

  const emoteByKey = reconcileSettledSpecs(emoteSettled, context);
  const badgeByKey = reconcileSettledSpecs(badgeSettled, context);

  const anyFailure = [...emoteSettled, ...badgeSettled].some(
    entry => entry.result.status === 'rejected',
  );

  chatStore$.persisted.globalCaches.set({
    lastUpdated: anyFailure ? existing.lastUpdated : Date.now(),
    ...mapSlices(
      GLOBAL_EMOTE_SLICE_KEYS,
      key => emoteByKey.get(key) ?? existing[key],
    ),
    ...mapSlices(
      GLOBAL_BADGE_SLICE_KEYS,
      key => badgeByKey.get(key) ?? existing[key],
    ),
  });
}

interface RefreshGlobalChatResourcesOptions {
  channelId: string;
  trigger: string;
}

export function refreshGlobalChatResources({
  channelId,
  trigger,
}: RefreshGlobalChatResourcesOptions): Promise<GlobalSettledSpec[]> {
  return globalChatResourceGuard.run(GUARD_KEY, async ctx => {
    const [emoteSettled, badgeSettled] = await Promise.all([
      settleSpecs(buildGlobalEmoteResourceSpecs()),
      settleSpecs(buildGlobalBadgeResourceSpecs()),
    ]);

    const settled = [...emoteSettled, ...badgeSettled];

    reportResourceResults({ channelId, settled, trigger });

    if (ctx.stillCurrent()) {
      writeGlobalResults(emoteSettled, badgeSettled);
    }

    return settled;
  });
}

export async function ensureGlobalChatResources(): Promise<void> {
  if (
    !isGlobalCacheStale(chatStore$.persisted.globalCaches.peek(), Date.now())
  ) {
    return;
  }

  await refreshGlobalChatResources({
    channelId: '',
    trigger: 'global_resource_ensure',
  });
}
