import type { ViewStyle } from 'react-native';

import type { ClearChatTags } from '@app/types/chat/irc-tags/clearchat';
import type { ClearMsgTags } from '@app/types/chat/irc-tags/clearmsg';
import type { GlobalUserStateTags } from '@app/types/chat/irc-tags/globaluserstate';
import type { NoticeTags } from '@app/types/chat/irc-tags/notice';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { RoomStateTags } from '@app/types/chat/irc-tags/roomstate';
import type {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  UserNoticeVariantMap,
} from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import type { PaintData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export type { PaintData, SanitisedBadgeSet, SanitisedEmote };

export interface UserCosmetics {
  paint_id: string | null;
  badge_id: string | null;
  paints: PaintData[];
  badges: SanitisedBadgeSet[];
  personal_emotes?: SanitisedBadgeSet[];
  user_info: {
    lastUpdate: number;
    user_id: string;
    ttv_user_id: string | null;
    avatar_url: string | null;
    personal_set_id: string[];
    color?: string;
  };
}

export interface UserPaint extends PaintData {
  ttv_user_id: string;
}

export interface ChatUser {
  name: string;
  color: string;
  cosmetics?: UserCosmetics;
  avatar: string | null;
  userId: string;
}

export interface Bit {
  name: string;
  tiers: { min_bits: string }[];
}

export interface ChatMessageType<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> {
  id: string;
  /**
   * Monotonic per-session arrival number, assigned when the message enters the
   * store. Unlike a list index it never shifts when the window front-trims, so
   * derivations like alternating-row parity stay stable for a message's whole
   * lifetime.
   */
  seq?: number;
  /**
   * Wall-clock ms when the message was committed to the store. Preserved on
   * cache restore so replayed rows never read as freshly arrived.
   */
  committedAt?: number;
  /**
   * Set on messages replayed from the recent-messages history API or restored
   * from the persisted cache so they skip live-arrival treatment such as the
   * slide-in entrance.
   */
  isHistorical?: boolean;
  userstate: UserStateTags;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  timestamp?: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName?: string;
  isSpecialNotice?: boolean;
  moderationNotice?: string;
  cachedSenderColor?: string;
  /**
   * Set on live PRIVMSGs at ingest while the emote/badge parse is deferred to
   * commit time. Stripped when the message is finalized; the store never sees
   * it.
   */
  pendingEmoteParse?: boolean;
  replyDisplayName: string;
  replyBody: string;
  parentColor?: string;
  isChannelPointRedemption?: boolean;
  isAnnouncement?: boolean;
  isAction?: boolean;
  isHighlightedMessage?: boolean;
  isSharedChatDuplicated?: boolean;
  isTwitchSystemNotice?: boolean;
  notice_tags?: TNoticeType extends 'userstate'
    ? UserStateTags
    : TNoticeType extends 'usernotice'
      ? TVariant extends keyof UserNoticeVariantMap
        ? UserNoticeTagsByVariant<TVariant>
        : UserNoticeTags
      : TNoticeType extends 'clearchat'
        ? ClearChatTags
        : TNoticeType extends 'clearmsg'
          ? ClearMsgTags
          : TNoticeType extends 'globalusernotice'
            ? GlobalUserStateTags
            : TNoticeType extends 'roomstate'
              ? RoomStateTags
              : TNoticeType extends 'notice'
                ? NoticeTags
                : never;
}

export type AnyChatMessageType =
  | ChatMessageType<'usernotice', 'viewermilestone'>
  | ChatMessageType<'usernotice', 'sub'>
  | ChatMessageType<'usernotice', 'resub'>
  | ChatMessageType<'usernotice', 'subgift'>
  | ChatMessageType<'usernotice', 'submysterygift'>
  | ChatMessageType<'usernotice', 'giftpaidupgrade'>
  | ChatMessageType<'usernotice', 'anongiftpaidupgrade'>
  | ChatMessageType<'usernotice', 'rewardgift'>
  | ChatMessageType<'usernotice', 'raid'>
  | ChatMessageType<'usernotice', 'unraid'>
  | ChatMessageType<'usernotice', 'bitsbadgetier'>
  | ChatMessageType<'usernotice', 'sharedchatnotice'>
  | ChatMessageType<'usernotice', 'modiversary'>
  | ChatMessageType<'usernotice'>;

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

export interface ChannelCacheType {
  lastUpdated: number;
  twitchChannelEmotes: SanitisedEmote[];
  twitchSubscriberEmotes: SanitisedEmote[];
  twitchSubscriberEmotesUserId?: string;
  /**
   * Streamer display name + pfp for each unique owner_id found in
   * twitchSubscriberEmotes; optional because persisted caches written
   * before this field existed won't have it.
   */
  twitchSubscriberChannelProfiles?: Record<string, SubscriberChannelProfile>;
  sevenTvChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  twitchChannelBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  sevenTvEmoteSetId?: string;
  badgesLastUpdated?: number;
}

/**
 * Channel-invariant provider data, stored once instead of duplicated into
 * every channel cache. `lastUpdated` is its own freshness stamp - global
 * slices refresh on their own TTL, independent of any channel's.
 */
export interface GlobalCacheType {
  lastUpdated: number;
  twitchGlobalEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
}

export const MAX_CACHED_CHANNELS = 20;
export const MAX_COSMETIC_ENTRIES = 500;
export const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
export const BADGE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const emptyEmoteData = {
  twitchChannelEmotes: [],
  twitchSubscriberEmotes: [],
  twitchSubscriberEmotesUserId: undefined,
  twitchSubscriberChannelProfiles: {},
  sevenTvChannelEmotes: [],
  ffzChannelEmotes: [],
  bttvChannelEmotes: [],
  twitchChannelBadges: [],
  ffzChannelBadges: [],
  lastUpdated: 0,
  badgesLastUpdated: 0,
  sevenTvEmoteSetId: undefined,
} satisfies ChannelCacheType;

export const emptyGlobalCacheData = {
  lastUpdated: 0,
  twitchGlobalEmotes: [],
  sevenTvGlobalEmotes: [],
  ffzGlobalEmotes: [],
  bttvGlobalEmotes: [],
  twitchGlobalBadges: [],
  ffzGlobalBadges: [],
} satisfies GlobalCacheType;

/**
 * Consumer-facing emote-data shape: channel-cache fields plus the slices that
 * are not stored per channel - the shared global provider slices,
 * session-scoped 7TV personal emotes, and the chatterinoBadges set resolved
 * from the bundled table at read time.
 */
export const emptyResolvedEmoteData = {
  ...emptyEmoteData,
  ...emptyGlobalCacheData,
  lastUpdated: 0,
  sevenTvPersonalEmotes: {} as Record<string, SanitisedEmote[]>,
  chatterinoBadges: [] as SanitisedBadgeSet[],
  bttvBadges: [] as SanitisedBadgeSet[],
};
