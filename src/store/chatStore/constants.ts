import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

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
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import type { ViewStyle } from 'react-native';

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
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
> {
  id: string;
  userstate: UserStateTags;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName?: string;
  isSpecialNotice?: boolean;
  cachedSenderColor?: string;
  replyDisplayName: string;
  replyBody: string;
  parentColor?: string;
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

export type ChatLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'LOADING'
  | 'COMPLETED'
  | 'ERROR';

export interface ChannelCacheType {
  emotes: SanitisedEmote[];
  badges: SanitisedBadgeSet[];
  lastUpdated: number;
  twitchChannelEmotes: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes: Record<string, SanitisedEmote[]>;
  sevenTvPersonalBadges: Record<string, SanitisedBadgeSet[]>;
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatterinoBadges: SanitisedBadgeSet[];
  sevenTvEmoteSetId?: string;
  badgesLastUpdated?: number;
}

export const MAX_CACHED_CHANNELS = 10;
export const MAX_COSMETIC_ENTRIES = 500;
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day
export const BADGE_CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

export const emptyEmoteData = {
  twitchChannelEmotes: [],
  twitchGlobalEmotes: [],
  sevenTvChannelEmotes: [],
  sevenTvGlobalEmotes: [],
  sevenTvPersonalBadges: {},
  sevenTvPersonalEmotes: {},
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  bttvGlobalEmotes: [],
  bttvChannelEmotes: [],
  twitchChannelBadges: [],
  twitchGlobalBadges: [],
  ffzChannelBadges: [],
  ffzGlobalBadges: [],
  badges: [],
  emotes: [],
  lastUpdated: 0,
  badgesLastUpdated: 0,
  sevenTvEmoteSetId: undefined,
  chatterinoBadges: [],
} satisfies ChannelCacheType;
