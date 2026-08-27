import type { ChannelCacheType, GlobalCacheType } from '../types/constants';
import { BADGE_CACHE_DURATION, CACHE_DURATION } from '../types/constants';

export interface ChannelRefreshPlanInput {
  cache: ChannelCacheType | undefined;
  globalCache: GlobalCacheType | undefined;
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

const CHANNEL_EMOTE_SLICES = [
  'twitchChannelEmotes',
  'sevenTvChannelEmotes',
  'ffzChannelEmotes',
  'bttvChannelEmotes',
] as const;

const GLOBAL_EMOTE_SLICES = [
  'twitchGlobalEmotes',
  'sevenTvGlobalEmotes',
  'ffzGlobalEmotes',
  'bttvGlobalEmotes',
] as const;

const GLOBAL_BADGE_SLICES = ['twitchGlobalBadges', 'ffzGlobalBadges'] as const;

/**
 * Pure freshness policy for a channel's cached resources; global provider
 * slices carry their own stamp, judged separately from the channel's TTL.
 */
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
  const hasEmptyGlobalEmotes = GLOBAL_EMOTE_SLICES.every(
    slice => (globalCache?.[slice]?.length || 0) === 0,
  );
  const hasEmptyEmotes =
    CHANNEL_EMOTE_SLICES.every(slice => (cache[slice]?.length || 0) === 0) &&
    hasEmptyGlobalEmotes;

  if (hasEmptyEmotes || cacheAgeMs >= CACHE_DURATION) {
    return { kind: 'full' };
  }

  const badgeCacheAgeMs =
    now - (cache.badgesLastUpdated ?? cache.lastUpdated ?? 0);
  const globalCacheAgeMs = now - (globalCache?.lastUpdated ?? 0);
  const hasEmptyGlobalSlices =
    hasEmptyGlobalEmotes &&
    GLOBAL_BADGE_SLICES.every(
      slice => (globalCache?.[slice]?.length || 0) === 0,
    );

  return {
    kind: 'cached',
    cacheAgeMs,
    badgeCacheAgeMs,
    fetchEmoteSetId: !cache.sevenTvEmoteSetId,
    fetchSubscriberEmotes: Boolean(
      twitchUserId && cache.twitchSubscriberEmotesUserId !== twitchUserId,
    ),
    refreshBadges: badgeCacheAgeMs >= BADGE_CACHE_DURATION,
    refreshGlobalResources:
      hasEmptyGlobalSlices || globalCacheAgeMs >= CACHE_DURATION,
  };
};
