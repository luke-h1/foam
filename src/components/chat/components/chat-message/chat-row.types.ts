import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ChatTokenRenderProps } from '@app/components/chat/components/chat-message/renderers/types/chat-token-render-props';
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
import type { MessageToken } from '@app/utils/chat/message-token';

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
  announcementAccentColor?: string | undefined;
  bodyVariant: ChatBodyVariant;
  clearRowLongPressTimer: () => void;
  customHighlightColor?: string | undefined;
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
  style?: StyleProp<ViewStyle> | undefined;
}

/**
 * What the body renderers need: the tokens, the sender chrome, and the reply
 * context around them.
 */
export interface ChatRowBodyState {
  announcementAccentColor?: string | undefined;
  badges: SanitisedBadgeSet[];
  bodyVariant: ChatBodyVariant;
  cachedSenderColor?: string | undefined;
  canJumpToReplyTarget: boolean;
  handleBadgePress: (badge: BadgePressData) => void;
  isAction: boolean;
  isChannelPointRedemption: boolean;
  isFirstMessage: boolean;
  isHighlightedMessage: boolean;
  isReplyingToCurrentUser: boolean;
  isReturningChatter: boolean;
  isSharedChatDuplicated: boolean;
  onReplyContextPress?: ((replyParentMessageId: string) => void) | undefined;
  onUsernamePress?: (() => void) | undefined;
  parentDisplayName?: string | undefined;
  tokenRenderProps: ChatTokenRenderProps;
  replyBody?: string | undefined;
  replyParentMessageId?: string | undefined;
  roomId?: string | undefined;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
  timestamp?: string | undefined;
  userstate: UserStateTags;
}

/**
 * The row's whole derived state; named rather than inferred so the renderers
 * declare a contract instead of inheriting whatever the hook returns today.
 */
export interface ChatRowState extends ChatRowSurfaceState, ChatRowBodyState {
  closeEmoteActionSheet: () => void;
  compact: boolean;
  disableEmoteAnimations: boolean;
  handleEmotePress: (token: EmotePressData) => void;
  isAnnouncement: boolean;
  selectedEmoteAction: EmotePressData | null;
}

export type ChatRowProps<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = ChatMessageType<TNoticeType, TVariant> & {
  broadcasterId?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  onReply?:
    | ((args: ChatMessageType<TNoticeType, TVariant>) => void)
    | undefined;
  onBadgePress?: ((data: BadgePressData) => void) | undefined;
  onMessageLongPress?:
    | ((data: MessageActionData<TNoticeType, TVariant>) => void)
    | undefined;
  onEmotePress?: ((data: EmotePressData) => void) | undefined;
  getMentionColor?: ((username: string) => string) | undefined;
  parseTextForEmotes?: ((text: string) => MessageToken[]) | undefined;
  onUsernamePress?: ((data: UsernamePressData) => void) | undefined;
  currentUsername?: string | undefined;
  currentUsernameNormalized?: string | undefined;
  density?: 'comfortable' | 'compact' | undefined;
  messageDisplay?: ChatMessageDisplayFlags | undefined;
  highlightedUserSet?: ReadonlySet<string> | undefined;
  highlightedUsers?: string[] | undefined;
  customHighlights?: CustomHighlight[] | undefined;
  fontScale?: ChatFontScale | undefined;
  onReplyContextPress?: ((replyParentMessageId: string) => void) | undefined;
};
