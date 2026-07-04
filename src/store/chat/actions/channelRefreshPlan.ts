import type { ChannelCacheType } from '../types/constants';
import { BADGE_CACHE_DURATION, CACHE_DURATION } from '../types/constants';

export interface ChannelRefreshPlanInput {
  cache: ChannelCacheType | undefined;
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
}

export type ChannelRefreshPlan = { kind: 'full' } | CachedChannelRefreshPlan;

const EMOTE_SLICES = [
  'twitchChannelEmotes',
  'twitchGlobalEmotes',
  'sevenTvChannelEmotes',
  'sevenTvGlobalEmotes',
  'ffzChannelEmotes',
  'ffzGlobalEmotes',
  'bttvChannelEmotes',
  'bttvGlobalEmotes',
] as const;

/**
 * Pure freshness policy for a channel's cached resources: decides between a
 * full reload and serving the cache, and which slices of a served cache still
 * need fetching. Effects live in loadChannelResourcesInternal.
 */
export const planChannelRefresh = ({
  cache,
  forceRefresh,
  now,
  twitchUserId,
}: ChannelRefreshPlanInput): ChannelRefreshPlan => {
  if (forceRefresh || !cache) {
    return { kind: 'full' };
  }

  const cacheAgeMs = now - cache.lastUpdated;
  const hasEmptyEmotes = EMOTE_SLICES.every(
    slice => (cache[slice]?.length || 0) === 0,
  );

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
    refreshBadges: badgeCacheAgeMs >= BADGE_CACHE_DURATION,
  };
};
