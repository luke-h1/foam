import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

import { useMappingHelper } from '@shopify/flash-list';

import type { ChatMessagePartRendererArgs } from '@app/components/Chat/components/ChatMessage/renderers/types/ChatMessagePartRendererArgs';
import type {
  BadgePressData,
  EmotePressData,
  RichChatMessageProps,
  RichChatMessageState,
} from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';
import { hasSharedChannelPointsMessage } from '@app/components/Chat/util/channelPointsSharedMessage';
import { getAnnouncementAccentColor } from '@app/components/Chat/util/getAnnouncementAccentColor';
import { getAnnouncementColorParam } from '@app/components/Chat/util/richChatMessage/getAnnouncementColorParam';
import { getChatBodyInfo } from '@app/components/Chat/util/richChatMessage/getChatBodyInfo';
import { getPartIdentity } from '@app/components/Chat/util/richChatMessage/getPartIdentity';
import { isUserNoticeTags } from '@app/components/Chat/util/richChatMessage/isUserNoticeTags';
import { toChatMessageData } from '@app/components/Chat/util/richChatMessage/toChatMessageData';
import { usePreference } from '@app/store/preferenceStore';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { findCustomHighlight } from '@app/utils/chat/customHighlights/findCustomHighlight';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export const MESSAGE_LONG_PRESS_DELAY_MS = 650;

const LONG_PRESS_MOVE_TOLERANCE_DP = 10;

export function useRichChatMessage<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(props: RichChatMessageProps<TNoticeType, TVariant>): RichChatMessageState {
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
    messageDisplay,
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
    isChannelPointRedemption: messageIsChannelPointRedemption = false,
    isAction = false,
    isAnnouncement: messageIsAnnouncement = false,
    isHighlightedMessage: messageIsHighlightedMessage = false,
    isSharedChatDuplicated: messageIsSharedChatDuplicated = false,
    isTwitchSystemNotice: messageIsTwitchSystemNotice = false,
  } = props;

  // Flags a message carries in its own data default from the message; the
  // renderer's messageDisplay wins wherever it sets one.
  const {
    disableEmoteAnimations = false,
    isChannelPointRedemption = messageIsChannelPointRedemption,
    isAnnouncement = messageIsAnnouncement,
    isHighlightedMessage = messageIsHighlightedMessage,
    isSharedChatDuplicated:
      displayIsSharedChatDuplicated = messageIsSharedChatDuplicated,
    isTwitchSystemNotice = messageIsTwitchSystemNotice,
    showInlineReplyContext = true,
    showTimestamp = true,
    isAlternatingRow = false,
    isHighlightedMessageTarget = false,
  } = messageDisplay ?? {};
  const sharedChatEnabled = usePreference('sharedChatEnabled');
  const isSharedChatDuplicated =
    displayIsSharedChatDuplicated && sharedChatEnabled;
  const { getMappingKey } = useMappingHelper();
  const [selectedEmoteAction, setSelectedEmoteAction] =
    useState<EmotePressData | null>(null);
  const rowLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Set from each emote's onTouchStart (which bubbles before the row's), so
  // the single row-level long-press timer can open the emote sheet without a
  // Pressable per emote (busy rows would mount hundreds of them).
  const pressedEmotePartRef = useRef<EmotePressData | null>(null);
  const rowTouchOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      setSelectedEmoteAction(null);
    };
  }, []);
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
  const getPartKey = useCallback(
    (part: ParsedPart, index: number) =>
      getMappingKey(getPartIdentity(part, index), index),
    [getMappingKey],
  );

  const handleEmotePress = (part: EmotePressData) => {
    onEmotePress?.(part);
  };

  const stopRowLongPressTimer = () => {
    if (!rowLongPressTimerRef.current) {
      return;
    }

    clearTimeout(rowLongPressTimerRef.current);
    rowLongPressTimerRef.current = null;
  };

  const clearRowLongPressTimer = () => {
    pressedEmotePartRef.current = null;
    rowTouchOriginRef.current = null;
    stopRowLongPressTimer();
  };

  const handleRowTouchMove = (event: GestureResponderEvent) => {
    const origin = rowTouchOriginRef.current;
    if (!origin) {
      return;
    }

    const { pageX, pageY } = event.nativeEvent;
    if (
      Math.abs(pageX - origin.x) > LONG_PRESS_MOVE_TOLERANCE_DP ||
      Math.abs(pageY - origin.y) > LONG_PRESS_MOVE_TOLERANCE_DP
    ) {
      clearRowLongPressTimer();
    }
  };

  useEffect(
    () => () => {
      if (rowLongPressTimerRef.current) {
        clearTimeout(rowLongPressTimerRef.current);
        rowLongPressTimerRef.current = null;
      }
    },
    [],
  );

  const handleEmoteTouchStart = useCallback((part: EmotePressData) => {
    pressedEmotePartRef.current = part;
  }, []);

  const closeEmoteActionSheet = () => {
    setSelectedEmoteAction(null);
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

  const partRendererArgs = {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    getPartKey,
    onEmoteTouchStart: handleEmoteTouchStart,
    message,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags: isUserNoticeTags(notice_tags) ? notice_tags : undefined,
    parseTextForEmotes,
  } satisfies ChatMessagePartRendererArgs;

  const {
    hasSubscriptionNotice,
    mentionsCurrentUser,
    variant: detectedBodyVariant,
  } = getChatBodyInfo(
    message,
    normalisedCurrentUsername,
    sender,
    isTwitchSystemNotice,
    isAnnouncement,
  );

  const customHighlight =
    detectedBodyVariant === 'user_chat' &&
    !moderationNotice &&
    customHighlights &&
    customHighlights.length > 0
      ? findCustomHighlight(message, customHighlights)
      : undefined;

  const noticeMsgId =
    notice_tags && 'msg-id' in notice_tags ? notice_tags['msg-id'] : undefined;
  const bodyVariant =
    detectedBodyVariant === 'twitch_system_notice' &&
    (noticeMsgId === 'raid' || noticeMsgId === 'unraid')
      ? 'raid'
      : detectedBodyVariant;

  const isAppSystemSender = bodyVariant === 'app_system_sender';
  const isUserChat = bodyVariant === 'user_chat';
  const showChannelPointsRewardChrome = Boolean(
    isUserChat &&
    userstate.username &&
    (isHighlightedMessage ||
      (isChannelPointRedemption && hasSharedChannelPointsMessage(message))),
  );

  const roomId =
    (typeof userstate['room-id'] === 'string'
      ? userstate['room-id']
      : undefined) ?? broadcasterId;

  const canReply =
    onReply &&
    !moderationNotice &&
    !hasSubscriptionNotice &&
    bodyVariant !== 'stv_emote_event' &&
    bodyVariant !== 'viewer_milestone' &&
    userstate.username &&
    sender?.toLowerCase() !== 'system';

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

  const startRowLongPressTimer = (event: GestureResponderEvent) => {
    // Only stop the timer here: the pressed emote (if any) was just recorded
    // by the emote's own onTouchStart, which bubbles before the row's.
    stopRowLongPressTimer();
    rowTouchOriginRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
    rowLongPressTimerRef.current = setTimeout(() => {
      rowLongPressTimerRef.current = null;
      const pressedEmotePart = pressedEmotePartRef.current;
      pressedEmotePartRef.current = null;

      if (pressedEmotePart) {
        setSelectedEmoteAction(pressedEmotePart);
        return;
      }

      if (canReply || onMessageLongPress) {
        handleLongPress();
      }
    }, MESSAGE_LONG_PRESS_DELAY_MS);
  };

  const isReply = Boolean(parentDisplayName);
  const replyParentMessageId = userstate['reply-parent-msg-id'];
  const isFirstMessage = userstate['first-msg'] === '1';
  const isReturningChatter =
    !isFirstMessage && userstate['returning-chatter'] === '1';
  const shouldRenderInlineReply =
    showInlineReplyContext &&
    isReply &&
    Boolean(replyBody || parentDisplayName);
  const canJumpToReplyTarget =
    Boolean(onReplyContextPress) && Boolean(replyParentMessageId);
  const isReplyingToCurrentUser = Boolean(
    normalisedCurrentUsername &&
    (normaliseChatUsername(replyDisplayName) === normalisedCurrentUsername ||
      normaliseChatUsername(parentDisplayName) === normalisedCurrentUsername),
  );

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
    customHighlightColor: customHighlight?.color,
    disableEmoteAnimations,
    getMappingKey,
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
    partRendererArgs,
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
