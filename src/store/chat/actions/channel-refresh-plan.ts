import { CACHE_DURATION } from '../types/cache-limits';
import {
  CHANNEL_EMOTE_SLICE_KEYS,
  type ChatResourceSliceKey,
  GLOBAL_BADGE_SLICE_KEYS,
  GLOBAL_EMOTE_SLICE_KEYS,
} from '../types/chat-resource-slices';
import type { ChannelCacheType, GlobalCacheType } from '../types/constants';

export interface ChannelRefreshPlanInput {
  cache?: ChannelCacheType;
  globalCache?: GlobalCacheType;
  forceRefresh: boolean;
  now: number;
  twitchUserId?: string;
}

export interface CachedChannelRefreshPlan {
  kind: 'cached';
  cacheAgeMs: number;
  badgeCacheAgeMs: number;
  fetchEmoteSetId: boolean;
  fetchSubscriberEmotes: boolean;
  refreshBadges: boolean;
  refreshGlobalResources: boolean;
}

export type ChannelRefreshPlan = { kind: 'full' } | CachedChannelRefreshPlan;

const CHANNEL_EMOTE_SLICES = CHANNEL_EMOTE_SLICE_KEYS.filter(
  key => key !== 'twitchSubscriberEmotes',
);

const isEmptyGroup = (
  globalCache: GlobalCacheType | undefined,
  keys: readonly ChatResourceSliceKey<'global'>[],
): boolean => keys.every(key => (globalCache?.[key]?.length ?? 0) === 0);

/**
 * The one emptiness rule for the global slot: an empty emote group or an
 * empty badge group needs a refetch. A channel-copy seed can stamp
 * `lastUpdated` with badges still empty, which served an empty Badges tab
 * until the TTL ran out.
 */
const hasEmptyGlobalGroup = (
  globalCache: GlobalCacheType | undefined,
): boolean =>
  isEmptyGroup(globalCache, GLOBAL_EMOTE_SLICE_KEYS) ||
  isEmptyGroup(globalCache, GLOBAL_BADGE_SLICE_KEYS);

/**
 * The one staleness rule for the global slot: an empty group, or a stamp
 * older than the cache window.
 */
export const isGlobalCacheStale = (
  globalCache: GlobalCacheType | undefined,
  now: number,
): boolean =>
  hasEmptyGlobalGroup(globalCache) ||
  now - (globalCache?.lastUpdated ?? 0) >= CACHE_DURATION;

export const planChannelRefresh = ({
  cache,
  forceRefresh,
  globalCache,
  now,
  twitchUserId,
}: ChannelRefreshPlanInput): ChannelRefreshPlan => {
  if (forceRefresh || !cache) {
    return { kind: 'full' };
  }

  const cacheAgeMs = now - cache.lastUpdated;

  const hasEmptyEmotes =
    CHANNEL_EMOTE_SLICES.every(slice => (cache[slice]?.length || 0) === 0) &&
    isEmptyGroup(globalCache, GLOBAL_EMOTE_SLICE_KEYS);

  if (hasEmptyEmotes || cacheAgeMs >= CACHE_DURATION) {
    return { kind: 'full' };
  }

  const badgeCacheAgeMs =
    now - (cache.badgesLastUpdated ?? cache.lastUpdated ?? 0);

  return {
    kind: 'cached',
    cacheAgeMs,
    badgeCacheAgeMs,
    fetchEmoteSetId: !cache.sevenTvEmoteSetId,
    fetchSubscriberEmotes: Boolean(
      twitchUserId && cache.twitchSubscriberEmotesUserId !== twitchUserId,
    ),
    refreshBadges: badgeCacheAgeMs >= CACHE_DURATION,
    refreshGlobalResources: isGlobalCacheStale(globalCache, now),
  };
};
