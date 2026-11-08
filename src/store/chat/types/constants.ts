import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  CHANNEL_SLICE_KEYS,
  type ChatResourceSliceKey,
  type ChatResourceSliceRecord,
  GLOBAL_SLICE_KEYS,
  mapSlices,
} from './chat-resource-slices';

export type ChatLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'LOADING'
  | 'COMPLETED'
  | 'ERROR';

export interface SubscriberChannelProfile {
  name: string;
  profileImageUrl: string;
}

/**
 * The slice fields come from `CHAT_RESOURCE_SLICES`; they are listed here too
 * so the shape reads in one place.
 */
export interface ChannelCacheType extends ChatResourceSliceRecord<
  ChatResourceSliceKey<'channel'>
> {
  lastUpdated: number;
  twitchChannelEmotes: SanitisedEmote[];
  twitchSubscriberEmotes: SanitisedEmote[];
  twitchSubscriberEmotesUserId?: string;
  /**
   * Streamer name + pfp per owner_id in twitchSubscriberEmotes; optional
   * because older persisted caches lack it.
   */
  twitchSubscriberChannelProfiles?: Record<string, SubscriberChannelProfile>;
  sevenTvChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  twitchChannelBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  sevenTvEmoteSetId?: string;
  badgesLastUpdated?: number;
  /**
   * Stamped by a 7TV-only update (set switch or live emote event). It stays
   * apart from `lastUpdated`, which stamps a fetch of every provider, so a
   * 7TV event cannot make the other providers look fresh.
   */
  sevenTvUpdatedAt?: number;
}

export interface GlobalCacheType extends ChatResourceSliceRecord<
  ChatResourceSliceKey<'global'>
> {
  lastUpdated: number;
  twitchGlobalEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
}

/**
 * Factories, not shared constants: legend-state's hydration merge writes
 * through a shared object, so "clear cache" would return hydrated data.
 */
export const makeEmptyEmoteData = (): ChannelCacheType => ({
  ...mapSlices(CHANNEL_SLICE_KEYS, () => []),
  twitchSubscriberChannelProfiles: {},
  lastUpdated: 0,
  badgesLastUpdated: 0,
});

export const makeEmptyGlobalCacheData = (): GlobalCacheType => ({
  ...mapSlices(GLOBAL_SLICE_KEYS, () => []),
  lastUpdated: 0,
});
