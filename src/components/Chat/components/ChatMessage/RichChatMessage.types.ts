import type { ChatMessageDisplayFlags } from '@app/components/Chat/types/chatUiFlags';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preferences/state';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export type EmotePressData = ParsedPart<'emote'>;
export type BadgePressData = SanitisedBadgeSet;
export type MessageActionData<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = {
  message: ParsedPart[];
  username?: string;
  login?: string;
  userId?: string;
  messageData: ChatMessageType<TNoticeType, TVariant>;
};

export interface UsernamePressData {
  color?: string;
  login?: string;
  userId?: string;
  username: string;
}

export type RichChatMessageProps<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = ChatMessageType<TNoticeType, TVariant> & {
  broadcasterId?: string;
  style?: unknown;
  onReply?: (args: ChatMessageType<TNoticeType, TVariant>) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType, TVariant>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  onUsernamePress?: (data: UsernamePressData) => void;
  currentUsername?: string;
  currentUsernameNormalized?: string;
  density?: 'comfortable' | 'compact';
  messageDisplay?: ChatMessageDisplayFlags;
  disableEmoteAnimations?: boolean;
  showTimestamp?: boolean;
  showInlineReplyContext?: boolean;
  isAlternatingRow?: boolean;
  isHighlightedMessageTarget?: boolean;
  highlightedUserSet?: ReadonlySet<string>;
  highlightedUsers?: string[];
  customHighlights?: CustomHighlight[];
  fontScale?: ChatFontScale;
  onReplyContextPress?: (replyParentMessageId: string) => void;
};
