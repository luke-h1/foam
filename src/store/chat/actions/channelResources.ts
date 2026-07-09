import type { MonitoringWarningName } from '@app/lib/sentry';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

import type { ChannelCacheType } from '../types/constants';

export type ProviderName = 'bttv' | 'ffz' | 'seven_tv' | 'twitch';
export type ProviderResourceScope = 'channel' | 'global' | 'local' | 'personal';
export type ProviderResourceType = 'badges' | 'emotes';

export type Identifiable = { id: string };

/**
 * One ordered description of a single (provider, scope) resource: how to fetch
 * it, which cache field it populates, and how to label it in logs. The spec
 * list is the seam — adding a provider is a single entry, and the fan-out,
 * reporting, cache-reconcile, and merge are all driven from it.
 */
export interface ResourceSpec<
  TKey extends keyof ChannelCacheType,
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

export type EmoteCacheKey =
  | 'bttvChannelEmotes'
  | 'bttvGlobalEmotes'
  | 'ffzChannelEmotes'
  | 'ffzGlobalEmotes'
  | 'sevenTvChannelEmotes'
  | 'sevenTvGlobalEmotes'
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
  | 'twitchSubscriberEmotes';

export type BadgeCacheKey =
  | 'ffzChannelBadges'
  | 'ffzGlobalBadges'
  | 'twitchChannelBadges'
  | 'twitchGlobalBadges';

export type EmoteResourceSets = Pick<ChannelCacheType, EmoteCacheKey>;
export type BadgeResourceSets = Pick<ChannelCacheType, BadgeCacheKey>;

export type EmoteResourceSpec = ResourceSpec<EmoteCacheKey, SanitisedEmote>;
export type BadgeResourceSpec = ResourceSpec<BadgeCacheKey, SanitisedBadgeSet>;

export type SettledSpec<
  TKey extends keyof ChannelCacheType,
  TItem extends Identifiable,
> = {
  spec: ResourceSpec<TKey, TItem>;
  result: PromiseSettledResult<TItem[]>;
};

type AnySettledSpec = SettledSpec<keyof ChannelCacheType, Identifiable>;

export const deduplicateById = <T extends Identifiable>(
  items: readonly T[],
): T[] => Array.from(new Map(items.map(item => [item.id, item])).values());

export const combineUniqueById = <T extends Identifiable>(
  ...itemGroups: readonly T[][]
): T[] => deduplicateById(itemGroups.flat());

/**
 * Global (channel-independent) provider data is identical for every channel,
 * so re-downloading it on each channel join wastes a round trip per provider.
 * Cache the successful fetch per session with a TTL matching the cached-path
 * badge refresh window; failures are never cached, so the next join retries.
 */
const GLOBAL_RESOURCE_TTL_MS = 60 * 60 * 1000;

const globalResourceCache = new Map<
  string,
  { fetchedAt: number; promise: Promise<Identifiable[]> }
>();

export const clearGlobalResourceCache = (): void => {
  globalResourceCache.clear();
};

const fetchGlobalResourceOnce = <T extends Identifiable>(
  key: string,
  fetcher: () => Promise<T[]>,
): Promise<T[]> => {
  const now = Date.now();
  const cached = globalResourceCache.get(key);
  if (cached && now - cached.fetchedAt < GLOBAL_RESOURCE_TTL_MS) {
    return cached.promise as Promise<T[]>;
  }
  const promise = fetcher().catch((error: unknown) => {
    if (globalResourceCache.get(key)?.promise === promise) {
      globalResourceCache.delete(key);
    }
    throw error;
  });
  globalResourceCache.set(key, { fetchedAt: now, promise });
  return promise as Promise<T[]>;
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
 * Cap on how much of the overall resource-fetch timeout the 7TV set-id lookup
 * may consume when `sevenTvSetId` is still pending. Without this, a slow id
 * lookup could eat the whole `RESOURCE_FETCH_TIMEOUT_MS` window and leave no
 * time for the actual emote-set fetch, timing it out for a reason unrelated
 * to the emote-set request itself.
 */
export const SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS = 3000;

export const buildEmoteResourceSpecs = ({
  channelId,
  sevenTvSetId,
  sevenTvSetIdFallback = 'global',
  twitchUserId,
}: {
  channelId: string;
  /**
   * Only the 7TV channel-emote fetch depends on the set id, so it may be
   * passed as a pending promise — every other resource fetch starts
   * immediately instead of waiting a full round trip behind the id lookup.
   */
  sevenTvSetId: string | Promise<string>;
  /**
   * Used if `sevenTvSetId` is still pending after
   * `SEVEN_TV_SET_ID_LOOKUP_BUDGET_MS`, so the lookup can't consume the
   * emote-set fetch's whole timeout budget.
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
  {
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
  },
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
  {
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
  },
  buildSubscriberEmoteSpec({ channelId, twitchUserId }),
  {
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
  },
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
  {
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
  },
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
  {
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
  },
  {
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
  },
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
      error => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });

export const settleSpecs = async <
  TKey extends keyof ChannelCacheType,
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
}

const reconcileSettledSpec = <
  TKey extends keyof ChannelCacheType,
  TItem extends Identifiable,
>(
  { result, spec }: SettledSpec<TKey, TItem>,
  { channelId, existingCache }: ResourceCacheContext,
): TItem[] => {
  if (result.status === 'fulfilled') {
    return deduplicateById(result.value);
  }

  const cachedItems = (existingCache?.[spec.key] ?? []) as unknown as TItem[];

  if (cachedItems.length > 0) {
    logger.chat.info(`Using cached ${spec.label} as fallback`, {
      name: 'chat_resources_info',
      action: 'provider_resource_cache_fallback_used',
      cached_count: cachedItems.length,
      channel_id: channelId,
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
  TKey extends keyof ChannelCacheType,
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

export const PROVIDER_DISPLAY_NAMES: Record<ProviderName, string> = {
  bttv: 'BTTV',
  ffz: 'FFZ',
  seven_tv: '7TV',
  twitch: 'Twitch',
};

/**
 * Distinct human-readable provider names whose resource fetch rejected, in a
 * stable order, for surfacing a single "couldn't load X" chat notice.
 */
export const collectFailedProviderLabels = (
  settled: readonly AnySettledSpec[],
): string[] => {
  const failed = new Set<ProviderName>();
  settled.forEach(({ result, spec }) => {
    if (result.status === 'rejected') {
      failed.add(spec.provider);
    }
  });
  const labels: string[] = [];
  for (const provider of Object.keys(
    PROVIDER_DISPLAY_NAMES,
  ) as ProviderName[]) {
    if (failed.has(provider)) {
      labels.push(PROVIDER_DISPLAY_NAMES[provider]);
    }
  }
  return labels;
};

/**
 * True when at least one rejected resource spec still has a non-empty slice in
 * the channel cache to fall back to.
 */
export const hadCachedResourcesForFailedSpecs = (
  existingCache: ChannelCacheType | undefined,
  settled: readonly AnySettledSpec[],
): boolean => {
  if (!existingCache) {
    return false;
  }

  return settled.some(({ result, spec }) => {
    if (result.status !== 'rejected') {
      return false;
    }

    const cached = existingCache[spec.key as keyof ChannelCacheType];
    return Array.isArray(cached) && cached.length > 0;
  });
};
