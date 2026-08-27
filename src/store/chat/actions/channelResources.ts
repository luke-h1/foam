import type { MonitoringWarningName } from '@app/lib/sentry';
import { ApiError } from '@app/services/api/Client';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { logger } from '@app/utils/logger';

import type { ChannelCacheType, GlobalCacheType } from '../types/constants';

export type ProviderName = 'bttv' | 'ffz' | 'seven_tv' | 'twitch';
export type ProviderResourceScope = 'channel' | 'global' | 'local' | 'personal';
export type ProviderResourceType = 'badges' | 'emotes';

export type Identifiable = { id: string };

/**
 * What a resource fetch rejects with: a service-layer error, or a bare
 * string from a rejection that never carried one.
 */
export type ProviderFailureReason = Error | string;

export type ChannelEmoteCacheKey =
  | 'bttvChannelEmotes'
  | 'ffzChannelEmotes'
  | 'sevenTvChannelEmotes'
  | 'twitchChannelEmotes'
  | 'twitchSubscriberEmotes';

export type GlobalEmoteCacheKey =
  | 'bttvGlobalEmotes'
  | 'ffzGlobalEmotes'
  | 'sevenTvGlobalEmotes'
  | 'twitchGlobalEmotes';

export type EmoteCacheKey = ChannelEmoteCacheKey | GlobalEmoteCacheKey;

export type ChannelBadgeCacheKey = 'ffzChannelBadges' | 'twitchChannelBadges';

export type GlobalBadgeCacheKey = 'ffzGlobalBadges' | 'twitchGlobalBadges';

export type BadgeCacheKey = ChannelBadgeCacheKey | GlobalBadgeCacheKey;

export type ResourceCacheKey = EmoteCacheKey | BadgeCacheKey;

/**
 * One (provider, scope) resource. The spec list is the seam - adding a
 * provider is one entry; fan-out, reporting, reconcile and merge follow.
 */
export interface ResourceSpec<
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
> {
  key: TKey;
  /**
   * snake_case identifier used for failure reporting (`resource_name`).
   */
  name: string;
  /**
   * Human-readable name used for the cache-fallback breadcrumb.
   */
  label: string;
  provider: ProviderName;
  resourceType: ProviderResourceType;
  scope: ProviderResourceScope;
  warningName: MonitoringWarningName;
  fetch: () => Promise<TItem[]>;
}

export type ChannelEmoteResourceSets = Pick<
  ChannelCacheType,
  ChannelEmoteCacheKey
>;
export type ChannelBadgeResourceSets = Pick<
  ChannelCacheType,
  ChannelBadgeCacheKey
>;

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

export const deduplicateById = <T extends Identifiable>(
  items: readonly T[],
): T[] => Array.from(new Map(items.map(item => [item.id, item])).values());

/**
 * Global provider data is identical for every channel; cache successful
 * fetches per session. Failures are never cached, so the next join retries.
 */
const GLOBAL_RESOURCE_TTL_MS = 60 * 60 * 1000;

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
  if (cached && now - cached.fetchedAt < GLOBAL_RESOURCE_TTL_MS) {
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
}): EmoteResourceSpec => ({
  key: 'twitchSubscriberEmotes',
  name: 'twitch_subscriber_emotes',
  label: 'Twitch subscriber emotes',
  provider: 'twitch',
  resourceType: 'emotes',
  scope: 'personal',
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
export const SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS = 3000;

const SEVEN_TV_GLOBAL_EMOTE_SPEC: EmoteResourceSpec = {
  key: 'sevenTvGlobalEmotes',
  name: 'seven_tv_global_emotes',
  label: '7TV global emotes',
  provider: 'seven_tv',
  resourceType: 'emotes',
  scope: 'global',
  warningName: 'seven_tv_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('seven_tv_global_emotes', () =>
      sevenTvService.getSanitisedEmoteSet('global'),
    ),
};

const TWITCH_GLOBAL_EMOTE_SPEC: EmoteResourceSpec = {
  key: 'twitchGlobalEmotes',
  name: 'twitch_global_emotes',
  label: 'Twitch global emotes',
  provider: 'twitch',
  resourceType: 'emotes',
  scope: 'global',
  warningName: 'twitch_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('twitch_global_emotes', () =>
      twitchEmoteService.getGlobalEmotes(),
    ),
};

const BTTV_GLOBAL_EMOTE_SPEC: EmoteResourceSpec = {
  key: 'bttvGlobalEmotes',
  name: 'bttv_global_emotes',
  label: 'BTTV global emotes',
  provider: 'bttv',
  resourceType: 'emotes',
  scope: 'global',
  warningName: 'bttv_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('bttv_global_emotes', () =>
      bttvEmoteService.getSanitisedGlobalEmotes(),
    ),
};

const FFZ_GLOBAL_EMOTE_SPEC: EmoteResourceSpec = {
  key: 'ffzGlobalEmotes',
  name: 'ffz_global_emotes',
  label: 'FFZ global emotes',
  provider: 'ffz',
  resourceType: 'emotes',
  scope: 'global',
  warningName: 'ffz_emotes_warning',
  fetch: () =>
    fetchGlobalResourceOnce('ffz_global_emotes', () =>
      ffzService.getSanitisedGlobalEmotes(),
    ),
};

const TWITCH_GLOBAL_BADGE_SPEC: BadgeResourceSpec = {
  key: 'twitchGlobalBadges',
  name: 'twitch_global_badges',
  label: 'Twitch global badges',
  provider: 'twitch',
  resourceType: 'badges',
  scope: 'global',
  warningName: 'twitch_badges_warning',
  fetch: () =>
    fetchGlobalResourceOnce('twitch_global_badges', () =>
      twitchBadgeService.listSanitisedGlobalBadges(),
    ),
};

const FFZ_GLOBAL_BADGE_SPEC: BadgeResourceSpec = {
  key: 'ffzGlobalBadges',
  name: 'ffz_global_badges',
  label: 'FFZ global badges',
  provider: 'ffz',
  resourceType: 'badges',
  scope: 'global',
  warningName: 'ffz_badges_warning',
  fetch: () =>
    fetchGlobalResourceOnce('ffz_global_badges', () =>
      ffzService.getSanitisedGlobalBadges(),
    ),
};

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

export const buildEmoteResourceSpecs = ({
  channelId,
  sevenTvSetId,
  sevenTvSetIdFallback = 'global',
  twitchUserId,
}: {
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
}): EmoteResourceSpec[] => [
  {
    key: 'sevenTvChannelEmotes',
    name: 'seven_tv_channel_emotes',
    label: '7TV channel emotes',
    provider: 'seven_tv',
    resourceType: 'emotes',
    scope: 'channel',
    warningName: 'seven_tv_emotes_warning',
    fetch: async () => {
      const resolvedSetId = await Promise.race([
        Promise.resolve(sevenTvSetId),
        new Promise<string>(resolve => {
          setTimeout(
            () => resolve(sevenTvSetIdFallback),
            SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS,
          );
        }),
      ]);
      return sevenTvService.getSanitisedEmoteSet(resolvedSetId);
    },
  },
  SEVEN_TV_GLOBAL_EMOTE_SPEC,
  {
    key: 'twitchChannelEmotes',
    name: 'twitch_channel_emotes',
    label: 'Twitch channel emotes',
    provider: 'twitch',
    resourceType: 'emotes',
    scope: 'channel',
    warningName: 'twitch_emotes_warning',
    fetch: () => twitchEmoteService.getChannelEmotes(channelId),
  },
  TWITCH_GLOBAL_EMOTE_SPEC,
  buildSubscriberEmoteSpec({ channelId, twitchUserId }),
  BTTV_GLOBAL_EMOTE_SPEC,
  {
    key: 'bttvChannelEmotes',
    name: 'bttv_channel_emotes',
    label: 'BTTV channel emotes',
    provider: 'bttv',
    resourceType: 'emotes',
    scope: 'channel',
    warningName: 'bttv_emotes_warning',
    fetch: () => bttvEmoteService.getSanitisedChannelEmotes(channelId),
  },
  {
    key: 'ffzChannelEmotes',
    name: 'ffz_channel_emotes',
    label: 'FFZ channel emotes',
    provider: 'ffz',
    resourceType: 'emotes',
    scope: 'channel',
    warningName: 'ffz_emotes_warning',
    fetch: () => ffzService.getSanitisedChannelEmotes(channelId),
  },
  FFZ_GLOBAL_EMOTE_SPEC,
];

export const buildBadgeResourceSpecs = ({
  channelId,
}: {
  channelId: string;
}): BadgeResourceSpec[] => [
  {
    key: 'twitchChannelBadges',
    name: 'twitch_channel_badges',
    label: 'Twitch channel badges',
    provider: 'twitch',
    resourceType: 'badges',
    scope: 'channel',
    warningName: 'twitch_badges_warning',
    fetch: () => twitchBadgeService.listSanitisedChannelBadges(channelId),
  },
  TWITCH_GLOBAL_BADGE_SPEC,
  FFZ_GLOBAL_BADGE_SPEC,
  {
    key: 'ffzChannelBadges',
    name: 'ffz_channel_badges',
    label: 'FFZ channel badges',
    provider: 'ffz',
    resourceType: 'badges',
    scope: 'channel',
    warningName: 'ffz_badges_warning',
    fetch: () => ffzService.getSanitisedChannelBadges(channelId),
  },
];

export const RESOURCE_FETCH_TIMEOUT_MS = 8000;

export class ResourceFetchTimeoutError extends Error {
  constructor(resourceName: string, timeoutMs: number) {
    super(`${resourceName} fetch timed out after ${timeoutMs}ms`);
    this.name = 'ResourceFetchTimeoutError';
  }
}

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  resourceName: string,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ResourceFetchTimeoutError(resourceName, timeoutMs));
    }, timeoutMs);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: ProviderFailureReason) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const settleSpecs = async <
  TKey extends ResourceCacheKey,
  TItem extends Identifiable,
>(
  specs: readonly ResourceSpec<TKey, TItem>[],
  timeoutMs: number = RESOURCE_FETCH_TIMEOUT_MS,
): Promise<SettledSpec<TKey, TItem>[]> => {
  const results = await Promise.allSettled(
    specs.map(spec => withTimeout(spec.fetch(), timeoutMs, spec.name)),
  );
  return specs.map((spec, index) => ({ spec, result: results[index]! }));
};

export interface ResourceCacheContext {
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
      provider: spec.provider,
      resource_name: spec.label,
      resource_type: spec.resourceType,
      scope: spec.scope,
      screen: 'chat',
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
    counts[`${spec.provider}_${spec.scope}_${spec.resourceType}_count`] =
      result.status === 'fulfilled' ? result.value.length : 0;

    if (result.status !== 'rejected') {
      return;
    }

    failedResources += 1;
    logger.chat.warn(`Failed to load ${spec.name}`, {
      name: spec.warningName,
      error: result.reason,
      action: 'provider_resource_failed',
      channel_id: channelId,
      provider: spec.provider,
      resource_name: spec.name,
      resource_type: spec.resourceType,
      scope: spec.scope,
      screen: 'chat',
      trigger,
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

export const PROVIDER_DISPLAY_NAMES = new Map<ProviderName, string>([
  ['bttv', 'BTTV'],
  ['ffz', 'FFZ'],
  ['seven_tv', '7TV'],
  ['twitch', 'Twitch'],
]);

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
  const reasonByProvider = new Map<ProviderName, string>();
  settled.forEach(({ result, spec }) => {
    if (result.status === 'rejected' && !reasonByProvider.has(spec.provider)) {
      reasonByProvider.set(
        spec.provider,
        describeProviderFailureReason(result.reason),
      );
    }
  });

  const labels: string[] = [];
  for (const [provider, displayName] of PROVIDER_DISPLAY_NAMES) {
    const reason = reasonByProvider.get(provider);
    if (reason) {
      labels.push(`${displayName} (${reason})`);
    }
  }
  return labels;
};

/**
 * True when at least one rejected resource spec still has a non-empty cached
 * slice to fall back to.
 */
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
