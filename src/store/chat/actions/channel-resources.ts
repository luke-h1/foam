import {
  PROVIDER_DESCRIPTORS,
  SEVEN_TV_GLOBAL_EMOTE_SET_ID,
} from '@app/constants/emote-providers';
import type { MonitoringWarningName } from '@app/lib/sentry';
import { ApiError, isApiClientError } from '@app/services/api/client';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { ProviderId, SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { withTimeout } from '@app/utils/async/withTimeout';
import { logger } from '@app/utils/logger';

import { CACHE_DURATION } from '../types/cache-limits';
import {
  type ChatResourceSliceKey,
  SLICE_BY_KEY,
  type SliceKind,
  type SliceScope,
} from '../types/chat-resource-slices';
import type { ChannelCacheType, GlobalCacheType } from '../types/constants';

type SliceProvider = (typeof SLICE_BY_KEY)[ChatResourceSliceKey]['provider'];

interface Identifiable {
  id: string;
}

type ProviderFailureReason = Error | string;

export type EmoteCacheKey = ChatResourceSliceKey<'channel' | 'global', 'emote'>;

export type BadgeCacheKey = ChatResourceSliceKey<'channel' | 'global', 'badge'>;

type ResourceCacheKey = EmoteCacheKey | BadgeCacheKey;

interface ResourceSpecDefinition<
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
> {
  key: TKey;
  name: string;
  label: string;
  warningName: MonitoringWarningName;
  fetch: () => Promise<TItem[]>;
}

export interface ResourceSpec<
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
> extends ResourceSpecDefinition<TKey, TItem> {
  provider: SliceProvider;
  scope: SliceScope;
  kind: SliceKind;
}

export function defineResourceSpec<
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
>(definition: ResourceSpecDefinition<TKey, TItem>): ResourceSpec<TKey, TItem> {
  const { provider, scope, kind } = SLICE_BY_KEY[definition.key];

  return { ...definition, provider, scope, kind };
}

const getMonitoringFields = (
  spec: ResourceSpec<ResourceCacheKey, Identifiable>,
) => ({
  provider: PROVIDER_DESCRIPTORS[spec.provider].monitoringName,
  resource_type: `${spec.kind}s`,
  scope: spec.scope,
});

export type EmoteResourceSpec = ResourceSpec<EmoteCacheKey, SanitisedEmote>;
export type BadgeResourceSpec = ResourceSpec<BadgeCacheKey, SanitisedBadgeSet>;

export type SettledSpec<
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
> = {
  spec: ResourceSpec<TKey, TItem>;
  result: PromiseSettledResult<TItem[]>;
};

type AnySettledSpec = SettledSpec<ResourceCacheKey, Identifiable>;

const deduplicateById = <T extends Identifiable>(items: readonly T[]): T[] =>
  Array.from(new Map(items.map(item => [item.id, item])).values());

/**
 * Global provider data is identical for every channel; cache successful
 * fetches per session. Failures are never cached, so the next join retries.
 */
const globalResourceCache = new Map<
  string,
  { fetchedAt: number; promise: Promise<Identifiable[]> }
>();

/**
 * Fences the channel-independent fetches that write straight into
 * `globalCaches`; held here so `clearGlobalResourceCache` callers fence too.
 */
export const globalChatResourceGuard = createFetchOnceGuard();

export const clearGlobalResourceCache = (): void => {
  globalResourceCache.clear();
  globalChatResourceGuard.clear();
};

const fetchGlobalResourceOnce = <T extends Identifiable>(
  key: string,
  fetcher: () => Promise<T[]>,
): Promise<T[]> => {
  const now = Date.now();
  const cached = globalResourceCache.get(key);

  if (cached && now - cached.fetchedAt < CACHE_DURATION) {
    // SAFETY: a cache key is only ever populated by one fetcher, so its stored promise resolves that key's item type
    return cached.promise as Promise<T[]>;
  }

  const promise = fetcher().catch((error: ProviderFailureReason) => {
    if (globalResourceCache.get(key)?.promise === promise) {
      globalResourceCache.delete(key);
    }

    throw error;
  });

  globalResourceCache.set(key, { fetchedAt: now, promise });
  return promise;
};

export const buildSubscriberEmoteSpec = ({
  channelId,
  twitchUserId,
}: {
  channelId: string;
  twitchUserId?: string;
}): EmoteResourceSpec =>
  defineResourceSpec({
    key: 'twitchSubscriberEmotes',
    name: 'twitch_subscriber_emotes',
    label: 'Twitch subscriber emotes',
    warningName: 'twitch_emotes_warning',
    fetch: () =>
      twitchUserId
        ? twitchEmoteService.getSubscriberEmotes(twitchUserId, channelId)
        : Promise.resolve([]),
  });

/**
 * Caps a pending 7TV set-id lookup so it cannot eat the whole
 * `RESOURCE_FETCH_TIMEOUT_MS` window and time out the emote-set fetch.
 */
const SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS = 3000;

const SEVEN_TV_GLOBAL_EMOTE_SPEC = defineResourceSpec({
  key: 'sevenTvGlobalEmotes',
  name: 'seven_tv_global_emotes',
  label: '7TV global emotes',
  warningName: 'seven_tv_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('seven_tv_global_emotes', () =>
      sevenTvService.getSanitisedEmoteSet(SEVEN_TV_GLOBAL_EMOTE_SET_ID),
    ),
});

const TWITCH_GLOBAL_EMOTE_SPEC = defineResourceSpec({
  key: 'twitchGlobalEmotes',
  name: 'twitch_global_emotes',
  label: 'Twitch global emotes',
  warningName: 'twitch_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('twitch_global_emotes', () =>
      twitchEmoteService.getGlobalEmotes(),
    ),
});

const BTTV_GLOBAL_EMOTE_SPEC = defineResourceSpec({
  key: 'bttvGlobalEmotes',
  name: 'bttv_global_emotes',
  label: 'BTTV global emotes',
  warningName: 'bttv_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('bttv_global_emotes', () =>
      bttvEmoteService.getSanitisedGlobalEmotes(),
    ),
});

const FFZ_GLOBAL_EMOTE_SPEC = defineResourceSpec({
  key: 'ffzGlobalEmotes',
  name: 'ffz_global_emotes',
  label: 'FFZ global emotes',
  warningName: 'ffz_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('ffz_global_emotes', () =>
      ffzService.getSanitisedGlobalEmotes(),
    ),
});

const TWITCH_GLOBAL_BADGE_SPEC = defineResourceSpec({
  key: 'twitchGlobalBadges',
  name: 'twitch_global_badges',
  label: 'Twitch global badges',
  warningName: 'twitch_badges_warning',
  fetch: () =>
    fetchGlobalResourceOnce('twitch_global_badges', () =>
      twitchBadgeService.listSanitisedGlobalBadges(),
    ),
});

const FFZ_GLOBAL_BADGE_SPEC = defineResourceSpec({
  key: 'ffzGlobalBadges',
  name: 'ffz_global_badges',
  label: 'FFZ global badges',
  warningName: 'ffz_badges_warning',
  fetch: () =>
    fetchGlobalResourceOnce('ffz_global_badges', () =>
      ffzService.getSanitisedGlobalBadges(),
    ),
});

export const buildGlobalEmoteResourceSpecs = (): EmoteResourceSpec[] => [
  SEVEN_TV_GLOBAL_EMOTE_SPEC,
  TWITCH_GLOBAL_EMOTE_SPEC,
  BTTV_GLOBAL_EMOTE_SPEC,
  FFZ_GLOBAL_EMOTE_SPEC,
];

export const buildGlobalBadgeResourceSpecs = (): BadgeResourceSpec[] => [
  TWITCH_GLOBAL_BADGE_SPEC,
  FFZ_GLOBAL_BADGE_SPEC,
];

interface BuildEmoteResourceSpecsOptions {
  channelId: string;
  /**
   * Only the 7TV channel-emote fetch depends on the set id, so it may be a
   * pending promise - every other fetch starts without waiting on the lookup.
   */
  sevenTvSetId: string | Promise<string>;
  /**
   * Used if `sevenTvSetId` is still pending after
   * `SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS`.
   */
  sevenTvSetIdFallback?: string;
  twitchUserId?: string;
}

export const buildEmoteResourceSpecs = ({
  channelId,
  sevenTvSetId,
  sevenTvSetIdFallback = SEVEN_TV_GLOBAL_EMOTE_SET_ID,
  twitchUserId,
}: BuildEmoteResourceSpecsOptions): EmoteResourceSpec[] => [
  defineResourceSpec({
    key: 'sevenTvChannelEmotes',
    name: 'seven_tv_channel_emotes',
    label: '7TV channel emotes',
    warningName: 'seven_tv_emotes_warning',
    fetch: async () => {
      const resolvedSetId = await withTimeout(
        Promise.resolve(sevenTvSetId),
        SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS,
        () => sevenTvSetIdFallback,
      );

      return sevenTvService.getSanitisedEmoteSet(resolvedSetId);
    },
  }),
  SEVEN_TV_GLOBAL_EMOTE_SPEC,
  defineResourceSpec({
    key: 'twitchChannelEmotes',
    name: 'twitch_channel_emotes',
    label: 'Twitch channel emotes',
    warningName: 'twitch_emotes_warning',
    fetch: () => twitchEmoteService.getChannelEmotes(channelId),
  }),
  TWITCH_GLOBAL_EMOTE_SPEC,
  buildSubscriberEmoteSpec({ channelId, twitchUserId }),
  BTTV_GLOBAL_EMOTE_SPEC,
  defineResourceSpec({
    key: 'bttvChannelEmotes',
    name: 'bttv_channel_emotes',
    label: 'BTTV channel emotes',
    warningName: 'bttv_emotes_warning',
    fetch: () => bttvEmoteService.getSanitisedChannelEmotes(channelId),
  }),
  defineResourceSpec({
    key: 'ffzChannelEmotes',
    name: 'ffz_channel_emotes',
    label: 'FFZ channel emotes',
    warningName: 'ffz_emotes_warning',
    fetch: () => ffzService.getSanitisedChannelEmotes(channelId),
  }),
  FFZ_GLOBAL_EMOTE_SPEC,
];

export const buildBadgeResourceSpecs = ({
  channelId,
}: {
  channelId: string;
}): BadgeResourceSpec[] => [
  defineResourceSpec({
    key: 'twitchChannelBadges',
    name: 'twitch_channel_badges',
    label: 'Twitch channel badges',
    warningName: 'twitch_badges_warning',
    fetch: () => twitchBadgeService.listSanitisedChannelBadges(channelId),
  }),
  TWITCH_GLOBAL_BADGE_SPEC,
  FFZ_GLOBAL_BADGE_SPEC,
  defineResourceSpec({
    key: 'ffzChannelBadges',
    name: 'ffz_channel_badges',
    label: 'FFZ channel badges',
    warningName: 'ffz_badges_warning',
    fetch: () => ffzService.getSanitisedChannelBadges(channelId),
  }),
];

const RESOURCE_FETCH_TIMEOUT_MS = 8000;

export class ResourceFetchTimeoutError extends Error {
  constructor(resourceName: string, timeoutMs: number) {
    super(`${resourceName} fetch timed out after ${timeoutMs}ms`);
    this.name = 'ResourceFetchTimeoutError';
  }
}

export const settleSpecs = async <
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
>(
  specs: readonly ResourceSpec<TKey, TItem>[],
  timeoutMs: number = RESOURCE_FETCH_TIMEOUT_MS,
): Promise<SettledSpec<TKey, TItem>[]> => {
  const results = await Promise.allSettled(
    specs.map(spec =>
      withTimeout(spec.fetch(), timeoutMs, () => {
        throw new ResourceFetchTimeoutError(spec.name, timeoutMs);
      }),
    ),
  );
  return specs.map((spec, index) => ({ spec, result: results[index]! }));
};

interface ResourceCacheContext {
  channelId: string;
  existingCache: ChannelCacheType | undefined;
  existingGlobalCache: GlobalCacheType | undefined;
}

const getCachedSliceForSpec = (
  spec: ResourceSpec<ResourceCacheKey, Identifiable>,
  {
    existingCache,
    existingGlobalCache,
  }: Pick<ResourceCacheContext, 'existingCache' | 'existingGlobalCache'>,
): Identifiable[] => {
  const slices: Partial<Record<ResourceCacheKey, Identifiable[]>> =
    spec.scope === 'global'
      ? (existingGlobalCache ?? {})
      : (existingCache ?? {});

  return slices[spec.key] ?? [];
};

const reconcileSettledSpec = <
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
>(
  { result, spec }: SettledSpec<TKey, TItem>,
  context: ResourceCacheContext,
): TItem[] => {
  if (result.status === 'fulfilled') {
    return deduplicateById(result.value);
  }

  // SAFETY: the cache slice a spec's key names holds the same item type that spec fetches
  const cachedItems = getCachedSliceForSpec(spec, context) as TItem[];

  if (cachedItems.length > 0) {
    logger.chat.info(`Using cached ${spec.label} as fallback`, {
      name: 'chat_resources_info',
      action: 'provider_resource_cache_fallback_used',
      cached_count: cachedItems.length,
      channel_id: context.channelId,
      resource_name: spec.label,
      screen: 'chat',
      ...getMonitoringFields(spec),
    });
  }

  return deduplicateById(cachedItems);
};

export const reconcileSettledSpecs = <
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
>(
  settled: readonly SettledSpec<TKey, TItem>[],
  context: ResourceCacheContext,
): Map<TKey, TItem[]> => {
  const reconciled = new Map<TKey, TItem[]>();

  settled.forEach(entry => {
    reconciled.set(entry.spec.key, reconcileSettledSpec(entry, context));
  });

  return reconciled;
};

export const reportResourceResults = ({
  channelId,
  settled,
  trigger,
}: {
  channelId: string;
  settled: readonly AnySettledSpec[];
  trigger: string;
}): void => {
  const counts: Record<string, number> = {};
  let failedResources = 0;

  settled.forEach(({ result, spec }) => {
    counts[`${spec.name}_count`] =
      result.status === 'fulfilled' ? result.value.length : 0;

    if (result.status !== 'rejected') {
      return;
    }

    failedResources += 1;

    if (isApiClientError(result.reason)) {
      return;
    }

    logger.chat.warn(`Failed to load ${spec.name}`, {
      name: spec.warningName,
      error: result.reason,
      action: 'provider_resource_failed',
      channel_id: channelId,
      resource_name: spec.name,
      screen: 'chat',
      trigger,
      ...getMonitoringFields(spec),
    });
  });

  logger.chat.info('Provider resources settled', {
    name: 'chat_resources_info',
    action: 'provider_resources_settled',
    channel_id: channelId,
    failed_resources: failedResources,
    screen: 'chat',
    total_resources: settled.length,
    trigger,
    ...counts,
  });
};

export const describeProviderFailureReason = (
  reason: ProviderFailureReason,
): string => {
  if (reason instanceof ResourceFetchTimeoutError) {
    return 'timed out';
  }

  if (reason instanceof ApiError) {
    return `HTTP ${reason.status}`;
  }

  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  return 'unknown error';
};

export const collectFailedProviderReasons = (
  settled: readonly AnySettledSpec[],
): string[] => {
  const reasonByProvider = new Map<ProviderId, string>();

  settled.forEach(({ result, spec }) => {
    if (result.status === 'rejected' && !reasonByProvider.has(spec.provider)) {
      reasonByProvider.set(
        spec.provider,
        describeProviderFailureReason(result.reason),
      );
    }
  });

  return Object.values(PROVIDER_DESCRIPTORS).flatMap(descriptor => {
    const reason = reasonByProvider.get(descriptor.id);
    return reason ? [`${descriptor.shortName} (${reason})`] : [];
  });
};

export const hadCachedResourcesForFailedSpecs = (
  context: Omit<ResourceCacheContext, 'channelId'>,
  settled: readonly AnySettledSpec[],
): boolean =>
  settled.some(({ result, spec }) => {
    if (result.status !== 'rejected') {
      return false;
    }

    return getCachedSliceForSpec(spec, context).length > 0;
  });
