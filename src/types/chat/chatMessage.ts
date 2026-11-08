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
import type { MessageToken } from '@app/types/chat/messageToken';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

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

export interface ChatUser {
  name: string;
  color: string;
  cosmetics?: UserCosmetics;
  avatar: string | null;
  /**
   * Unset for a chatter known only from a mention.
   */
  userId?: string;
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
   * Monotonic per-session arrival number. Unlike a list index it never shifts
   * on front-trims, so derivations like alternating-row parity stay stable.
   */
  seq?: number;
  /**
   * Wall-clock ms when the message was committed to the store. Preserved on
   * cache restore so replayed rows never read as freshly arrived.
   */
  committedAt?: number;
  /**
   * Set on replayed or cache-restored messages so they skip live-arrival
   * treatment such as the slide-in entrance.
   */
  isHistorical?: boolean;
  /**
   * Set when the message committed as part of a raid-sized flush, so a burst
   * of rows does not start one entrance animation per row in the same frame.
   */
  arrivedInBurst?: boolean;
  userstate: UserStateTags;
  message: MessageToken[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  timestamp?: string;
  sender: string;
  parentDisplayName?: string;
  isSpecialNotice?: boolean;
  moderationNotice?: string;
  cachedSenderColor?: string;
  /**
   * Set at ingest while the emote/badge parse is deferred to commit time;
   * stripped when the message is finalized, so the store never sees it.
   */
  pendingEmoteParse?: boolean;
  replyParentLogin: string;
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

export type AnyChatMessageType = ChatMessageType<
  'usernotice',
  keyof UserNoticeVariantMap
>;
