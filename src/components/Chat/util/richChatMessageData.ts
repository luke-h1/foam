import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';

import type { RichChatMessageProps } from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';

export function toChatMessageData<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>(
  props: RichChatMessageProps<TNoticeType, TVariant>,
): ChatMessageType<TNoticeType, TVariant> {
  const {
    onReply: _onReply,
    onBadgePress: _onBadgePress,
    onMessageLongPress: _onMessageLongPress,
    onEmotePress: _onEmotePress,
    getMentionColor: _getMentionColor,
    parseTextForEmotes: _parseTextForEmotes,
    onUsernamePress: _onUsernamePress,
    currentUsername: _currentUsername,
    currentUsernameNormalized: _currentUsernameNormalized,
    density: _density,
    messageDisplay: _messageDisplay,
    highlightedUserSet: _highlightedUserSet,
    highlightedUsers: _highlightedUsers,
    onReplyContextPress: _onReplyContextPress,
    broadcasterId: _broadcasterId,
    style: _style,
    ...messageData
  } = props;

  return messageData;
}
