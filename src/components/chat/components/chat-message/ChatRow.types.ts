import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ChatTokenRenderProps } from '@app/components/chat/components/chat-message/renderers/types/chat-token-render-props';
import type { ChatMessageDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import type {
  BadgePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { CustomHighlight } from '@app/types/chat/customHighlight';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';

interface ChatRowSurfaceState {
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
  tokenRenderProps: ChatTokenRenderProps;
  replyBody?: string;
  replyParentMessageId?: string;
  roomId?: string;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
  timestamp?: string;
  userstate: UserStateTags;
}

export interface ChatRowState extends ChatRowSurfaceState, ChatRowBodyState {
  density: ChatDensity;
  isAnnouncement: boolean;
}

/**
 * What a row needs besides the message itself: callbacks, viewer context and
 * display preferences. `CHAT_ROW_RENDER_PROP_KEYS` lists every key, so the
 * long-press handler can hand back the message alone.
 */
export interface ChatRowRenderProps<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> {
  broadcasterId?: string;
  currentUsername?: string;
  currentUsernameNormalized?: string;
  customHighlights?: CustomHighlight[];
  density?: ChatDensity;
  fontScale?: ChatFontScale;
  getMentionColor?: (username: string) => string;
  highlightedUserSet?: ReadonlySet<string>;
  messageDisplay?: ChatMessageDisplayFlags;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType, TVariant>) => void;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  onUsernamePress?: (data: UsernamePressData) => void;
  parseTextForEmotes?: (text: string) => MessageToken[];
  style?: StyleProp<ViewStyle>;
}

export type ChatRowProps<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = ChatMessageType<TNoticeType, TVariant> &
  ChatRowRenderProps<TNoticeType, TVariant>;
