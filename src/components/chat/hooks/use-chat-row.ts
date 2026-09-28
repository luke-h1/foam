import { useMemo } from 'react';

import type {
  BadgePressData,
  ChatRowProps,
  ChatRowState,
  EmotePressData,
} from '@app/components/chat/components/chat-message/chat-row.types';
import type { ChatTokenRenderProps } from '@app/components/chat/components/chat-message/renderers/types/chat-token-render-props';
import { canReplyToMessage } from '@app/components/chat/util/chat-row/can-reply-to-message';
import { getAnnouncementColorParam } from '@app/components/chat/util/chat-row/get-announcement-color-param';
import { getChatBodyPresentation } from '@app/components/chat/util/chat-row/get-chat-body-presentation';
import { getReplyFlags } from '@app/components/chat/util/chat-row/get-reply-flags';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/get-token-identity';
import { isUserNoticeTags } from '@app/components/chat/util/chat-row/is-user-notice-tags';
import { resolveMessageDisplayFlags } from '@app/components/chat/util/chat-row/resolve-message-display-flags';
import { toChatMessageData } from '@app/components/chat/util/chat-row/to-chat-message-data';
import { getAnnouncementAccentColor } from '@app/components/chat/util/get-announcement-accent-color';
import { usePreference } from '@app/store/preference-store';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { deriveChatBody } from '@app/utils/chat/derive-chat-body/derive-chat-body';

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

  const normalisedCurrentUsername =
    currentUsernameNormalized ?? normaliseChatUsername(currentUsername);

  // Identity-stable so the memoized span renderers can bail out.
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
    effectiveHighlightedUserSet?.has(messageSenderKey);

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
    replyBody,
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

  const tokenRenderProps = {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    getTokenKey: getTokenIdentity,
    onEmoteTouchStart: handleEmoteTouchStart,
    message,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags: isUserNoticeTags(notice_tags) ? notice_tags : undefined,
    parseTextForEmotes,
  } satisfies ChatTokenRenderProps;

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
