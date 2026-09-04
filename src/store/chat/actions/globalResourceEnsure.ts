import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { CACHE_DURATION } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  buildGlobalBadgeResourceSpecs,
  buildGlobalEmoteResourceSpecs,
  globalChatResourceGuard,
} from './channelResources';

const GUARD_KEY = 'globalChatResources';

/**
 * Fills `chatStore$.persisted.globalCaches` without joining a channel; the
 * guard only provides single-flight plus the post-purge write-back fence.
 */
export function ensureGlobalChatResources(): Promise<void> {
  const cache = chatStore$.persisted.globalCaches.peek();
  const hasEmotes =
    cache.twitchGlobalEmotes.length > 0 ||
    cache.sevenTvGlobalEmotes.length > 0 ||
    cache.bttvGlobalEmotes.length > 0 ||
    cache.ffzGlobalEmotes.length > 0;
  // Checked separately: a channel-copy seed can stamp `lastUpdated` with
  // badges still empty, serving an empty Badges tab until the TTL expired.
  const hasBadges =
    cache.twitchGlobalBadges.length > 0 || cache.ffzGlobalBadges.length > 0;
  if (
    hasEmotes &&
    hasBadges &&
    Date.now() - cache.lastUpdated < CACHE_DURATION
  ) {
    return Promise.resolve();
  }

  return globalChatResourceGuard.run(GUARD_KEY, ctx => {
    const emoteSpecs = buildGlobalEmoteResourceSpecs();
    const badgeSpecs = buildGlobalBadgeResourceSpecs();

    return Promise.all([
      Promise.allSettled(emoteSpecs.map(spec => spec.fetch())),
      Promise.allSettled(badgeSpecs.map(spec => spec.fetch())),
    ]).then(([emoteResults, badgeResults]) => {
      // A cache clear that lands mid-fetch fences this run, so the pre-clear
      // payload is dropped instead of being written back stamped fresh.
      if (!ctx.stillCurrent()) {
        return;
      }

      const existing = chatStore$.persisted.globalCaches.peek();
      const emoteByKey = new Map<string, SanitisedEmote[]>();
      let anyFailure = false;

      emoteSpecs.forEach((spec, index) => {
        const result = emoteResults[index];
        if (result?.status === 'fulfilled') {
          emoteByKey.set(spec.key, result.value);
        } else {
          anyFailure = true;
        }
      });

      const badgeByKey = new Map<string, SanitisedBadgeSet[]>();
      badgeSpecs.forEach((spec, index) => {
        const result = badgeResults[index];
        if (result?.status === 'fulfilled') {
          badgeByKey.set(spec.key, result.value);
        } else {
          anyFailure = true;
        }
      });

      chatStore$.persisted.globalCaches.set({
        lastUpdated: anyFailure ? existing.lastUpdated : Date.now(),
        twitchGlobalEmotes:
          emoteByKey.get('twitchGlobalEmotes') ?? existing.twitchGlobalEmotes,
        sevenTvGlobalEmotes:
          emoteByKey.get('sevenTvGlobalEmotes') ?? existing.sevenTvGlobalEmotes,
        ffzGlobalEmotes:
          emoteByKey.get('ffzGlobalEmotes') ?? existing.ffzGlobalEmotes,
        bttvGlobalEmotes:
          emoteByKey.get('bttvGlobalEmotes') ?? existing.bttvGlobalEmotes,
        twitchGlobalBadges:
          badgeByKey.get('twitchGlobalBadges') ?? existing.twitchGlobalBadges,
        ffzGlobalBadges:
          badgeByKey.get('ffzGlobalBadges') ?? existing.ffzGlobalBadges,
      });
    });
  });
}
