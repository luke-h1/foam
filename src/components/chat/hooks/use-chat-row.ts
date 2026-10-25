import { useMemo } from 'react';

import type {
  BadgePressData,
  ChatRowProps,
  ChatRowState,
  EmotePressData,
} from '@app/components/chat/components/chat-message/ChatRow.types';
import type { ChatTokenRenderProps } from '@app/components/chat/components/chat-message/renderers/types/chat-token-render-props';
import { canReplyToMessage } from '@app/components/chat/util/chat-row/canReplyToMessage';
import { getAnnouncementColorParam } from '@app/components/chat/util/chat-row/getAnnouncementColorParam';
import { getChatBodyPresentation } from '@app/components/chat/util/chat-row/getChatBodyPresentation';
import { getReplyFlags } from '@app/components/chat/util/chat-row/getReplyFlags';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import { isUserNoticeTags } from '@app/components/chat/util/chat-row/isUserNoticeTags';
import { resolveMessageDisplayFlags } from '@app/components/chat/util/chat-row/resolveMessageDisplayFlags';
import { toChatMessageData } from '@app/components/chat/util/chat-row/toChatMessageData';
import { getAnnouncementAccentColor } from '@app/components/chat/util/getAnnouncementAccentColor';
import { usePreference } from '@app/store/preference-store';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { deriveChatBody } from '@app/utils/chat/derive-chat-body/deriveChatBody';

import { useChatRowLongPress } from './use-chat-row-long-press';

export function useChatRow<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(props: ChatRowProps<TNoticeType, TVariant>): ChatRowState {
  const {
    userstate,
    message,
    badges,
    sender,
    parentDisplayName,
    replyBody,
    replyDisplayName,
    notice_tags,
    broadcasterId,
    onReply,
    onBadgePress,
    onMessageLongPress,
    onEmotePress,
    getMentionColor,
    parseTextForEmotes,
    onUsernamePress,
    currentUsername,
    currentUsernameNormalized,
    density = 'comfortable',
    fontScale,
    customHighlights,
    highlightedUserSet,
    highlightedUsers,
    moderationNotice,
    onReplyContextPress,
    isAction = false,
  } = props;

  const {
    disableEmoteAnimations,
    displayIsSharedChatDuplicated,
    isAlternatingRow,
    isAnnouncement,
    isChannelPointRedemption,
    isHighlightedMessage,
    isHighlightedMessageTarget,
    isTwitchSystemNotice,
    showInlineReplyContext,
    showTimestamp,
  } = resolveMessageDisplayFlags(props);

  const sharedChatEnabled = usePreference('sharedChatEnabled');

  const isSharedChatDuplicated =
    displayIsSharedChatDuplicated && sharedChatEnabled;

  const compact = density === 'compact';
  const resolvedFontScale = fontScale ?? 'default';

  const normalisedCurrentUsername =
    currentUsernameNormalized ?? normaliseChatUsername(currentUsername);

  const effectiveHighlightedUserSet = useMemo(
    () =>
      highlightedUserSet ??
      new Set((highlightedUsers ?? []).map(normaliseChatUsername)),
    [highlightedUserSet, highlightedUsers],
  );

  const messageSenderKey = normaliseChatUsername(
    userstate.username || userstate.login || sender,
  );

  const isHighlightedSender =
    messageSenderKey.length > 0 &&
    effectiveHighlightedUserSet.has(messageSenderKey);

  const handleEmotePress = (token: EmotePressData) => {
    onEmotePress?.(token);
  };

  const handleBadgePress = (badge: BadgePressData) => {
    onBadgePress?.(badge);
  };

  const handleUsernamePress = () => {
    if (!userstate.username) {
      return;
    }

    onUsernamePress?.({
      username: userstate.username,
      login: userstate.login,
      userId: userstate['user-id'],
      color: userstate.color,
    });
  };

  const {
    hasSubscriptionNotice,
    mentionsCurrentUser,
    variant: detectedBodyVariant,
  } = deriveChatBody(message, {
    currentUsername: normalisedCurrentUsername,
    isAnnouncement,
    isTwitchSystemNotice,
    sender,
  });

  const noticeMsgId =
    notice_tags && 'msg-id' in notice_tags ? notice_tags['msg-id'] : undefined;

  const {
    bodyVariant,
    customHighlightColor,
    isAppSystemSender,
    isUserChat,
    showChannelPointsRewardChrome,
  } = getChatBodyPresentation({
    customHighlights,
    detectedBodyVariant,
    isChannelPointRedemption,
    isHighlightedMessage,
    message,
    moderationNotice,
    noticeMsgId,
    userstate,
  });

  const messageRoomId = userstate['room-id'];

  const roomId =
    String(messageRoomId) === messageRoomId ? messageRoomId : broadcasterId;

  const canReply = canReplyToMessage({
    bodyVariant,
    hasReplyHandler: Boolean(onReply),
    hasSubscriptionNotice,
    moderationNotice,
    sender,
    userstate,
  });

  const handleLongPress = () => {
    const messageData = toChatMessageData(props);

    if (canReply) {
      onReply?.(messageData);
    }

    onMessageLongPress?.({
      message,
      username: userstate.username,
      login: userstate.login,
      userId: userstate['user-id'],
      messageData,
    });
  };

  const {
    canJumpToReplyTarget,
    isFirstMessage,
    isReplyingToCurrentUser,
    isReturningChatter,
    replyParentMessageId,
    shouldRenderInlineReply,
  } = getReplyFlags({
    normalisedCurrentUsername,
    onReplyContextPress,
    parentDisplayName,
    replyDisplayName,
    showInlineReplyContext,
    userstate,
  });

  const {
    clearRowLongPressTimer,
    closeEmoteActionSheet,
    handleEmoteTouchStart,
    handleRowTouchMove,
    selectedEmoteAction,
    startRowLongPressTimer,
  } = useChatRowLongPress({
    canLongPress: Boolean(canReply || onMessageLongPress),
    onLongPress: handleLongPress,
  });

  const tokenRenderProps: ChatTokenRenderProps = {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale: resolvedFontScale,
    getTokenKey: getTokenIdentity,
    message,
    getMentionColor,
    onEmoteTouchStart: handleEmoteTouchStart,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags: isUserNoticeTags(notice_tags) ? notice_tags : undefined,
    parseTextForEmotes,
  };

  const announcementAccentColor = isAnnouncement
    ? getAnnouncementAccentColor(getAnnouncementColorParam(notice_tags))
    : undefined;

  return {
    badges,
    announcementAccentColor,
    bodyVariant,
    cachedSenderColor: props.cachedSenderColor,
    canJumpToReplyTarget,
    clearRowLongPressTimer,
    closeEmoteActionSheet,
    handleRowTouchMove,
    compact,
    customHighlightColor,
    disableEmoteAnimations,
    handleBadgePress,
    handleEmotePress,
    isAppSystemSender,
    isAction,
    isAnnouncement,
    isHighlightedMessage,
    isSharedChatDuplicated,
    isChannelPointRedemption,
    isFirstMessage,
    isReturningChatter,
    isReplyingToCurrentUser,
    isHighlightedSender,
    isHighlightedMessageTarget,
    isAlternatingRow,
    isUserChat,
    mentionsCurrentUser,
    onReplyContextPress,
    onUsernamePress: onUsernamePress ? handleUsernamePress : undefined,
    parentDisplayName,
    tokenRenderProps,
    replyBody,
    replyParentMessageId,
    roomId,
    selectedEmoteAction,
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
    startRowLongPressTimer,
    style: props.style,
    timestamp: props.timestamp,
    userstate,
  };
}
