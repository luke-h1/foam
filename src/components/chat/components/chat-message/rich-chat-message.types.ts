import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ChatMessagePartRendererArgs } from '@app/components/chat/components/chat-message/renderers/types/chat-message-part-renderer-args';
import type { ChatMessageDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preference-store';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';
import type { ParsedPart } from '@app/utils/chat/parsed-part';

export type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
};

/**
 * What the row container needs to decide its surface: which tint, border and
 * background a row gets, plus the touch handlers that drive its long press.
 */
export interface ChatRowSurfaceState {
  announcementAccentColor?: string;
  bodyVariant: ChatBodyVariant;
  clearRowLongPressTimer: () => void;
  customHighlightColor?: string;
  handleRowTouchMove: (event: GestureResponderEvent) => void;
  isAlternatingRow: boolean;
  isAppSystemSender: boolean;
  isChannelPointRedemption: boolean;
  isFirstMessage: boolean;
  isHighlightedMessage: boolean;
  isHighlightedMessageTarget: boolean;
  isHighlightedSender: boolean;
  isReturningChatter: boolean;
  isUserChat: boolean;
  mentionsCurrentUser: boolean;
  startRowLongPressTimer: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * What the body renderers need: the parts, the sender chrome, and the reply
 * context around them.
 */
export interface ChatRowBodyState {
  announcementAccentColor?: string;
  badges: SanitisedBadgeSet[];
  bodyVariant: ChatBodyVariant;
  cachedSenderColor?: string;
  canJumpToReplyTarget: boolean;
  handleBadgePress: (badge: BadgePressData) => void;
  isAction: boolean;
  isChannelPointRedemption: boolean;
  isFirstMessage: boolean;
  isHighlightedMessage: boolean;
  isReplyingToCurrentUser: boolean;
  isReturningChatter: boolean;
  isSharedChatDuplicated: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  onUsernamePress?: () => void;
  parentDisplayName?: string;
  partRendererArgs: ChatMessagePartRendererArgs;
  replyBody?: string;
  replyParentMessageId?: string;
  roomId?: string;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
  timestamp?: string;
  userstate: UserStateTags;
}

/**
 * The row's whole derived state; named rather than inferred so the renderers
 * declare a contract instead of inheriting whatever the hook returns today.
 */
export interface RichChatMessageState
  extends ChatRowSurfaceState, ChatRowBodyState {
  closeEmoteActionSheet: () => void;
  compact: boolean;
  disableEmoteAnimations: boolean;
  handleEmotePress: (part: EmotePressData) => void;
  isAnnouncement: boolean;
  selectedEmoteAction: EmotePressData | null;
}

export type RichChatMessageProps<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = ChatMessageType<TNoticeType, TVariant> & {
  broadcasterId?: string;
  style?: StyleProp<ViewStyle>;
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
  highlightedUserSet?: ReadonlySet<string>;
  highlightedUsers?: string[];
  customHighlights?: CustomHighlight[];
  fontScale?: ChatFontScale;
  onReplyContextPress?: (replyParentMessageId: string) => void;
};
