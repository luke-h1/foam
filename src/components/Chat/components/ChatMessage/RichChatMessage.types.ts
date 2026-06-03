import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

export type EmotePressData = ParsedPart<'emote'>;
export type BadgePressData = SanitisedBadgeSet;
export type MessageActionData<TNoticeType extends NoticeVariants> = {
  message: ParsedPart[];
  username?: string;
  login?: string;
  userId?: string;
  messageData: ChatMessageType<TNoticeType>;
};

export interface UsernamePressData {
  color?: string;
  login?: string;
  userId?: string;
  username: string;
}

export type RichChatMessageProps<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
> = ChatMessageType<TNoticeType, TVariant> & {
  style?: unknown;
  onReply?: (args: ChatMessageType<TNoticeType>) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  onUsernamePress?: (data: UsernamePressData) => void;
  currentUsername?: string;
  currentUsernameNormalized?: string;
  density?: 'comfortable' | 'compact';
  disableEmoteAnimations?: boolean;
  showTimestamp?: boolean;
  highlightedUserSet?: ReadonlySet<string>;
  highlightedUsers?: string[];
  showInlineReplyContext?: boolean;
  isAlternatingRow?: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  isHighlightedMessageTarget?: boolean;
};
