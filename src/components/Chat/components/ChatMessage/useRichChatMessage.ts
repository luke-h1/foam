import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMappingHelper } from '@shopify/flash-list';

import type { ChatMessageDisplayFlags } from '@app/components/Chat/types/chatUiFlags';
import { hasSharedChannelPointsMessage } from '@app/components/Chat/util/channelPointsSharedMessage';
import { getAnnouncementAccentColor } from '@app/components/Chat/util/getAnnouncementAccentColor';
import { toChatMessageData } from '@app/components/Chat/util/richChatMessageData';
import {
  getAnnouncementColorParam,
  getChatBodyInfo,
  getPartIdentity,
  isUserNoticeTags,
  normaliseUsername,
} from '@app/components/Chat/util/richChatMessageHelpers';
import { usePreference } from '@app/store/preferenceStore';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import { findCustomHighlight } from '@app/utils/chat/customHighlights';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import type { UseChatMessagePartRendererArgs } from './renderers/useChatMessagePartRenderer';
import type {
  BadgePressData,
  EmotePressData,
  RichChatMessageProps,
} from './RichChatMessage.types';

export const MESSAGE_LONG_PRESS_DELAY_MS = 650;

export function useRichChatMessage<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(props: RichChatMessageProps<TNoticeType, TVariant>) {
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
    messageDisplay: messageDisplayProp,
    disableEmoteAnimations: topLevelDisableEmoteAnimations,
    showTimestamp: topLevelShowTimestamp,
    showInlineReplyContext: topLevelShowInlineReplyContext,
    isAlternatingRow: topLevelIsAlternatingRow,
    isHighlightedMessageTarget: topLevelIsHighlightedMessageTarget,
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

  const messageDisplay = {
    ...messageDisplayProp,
    ...(topLevelDisableEmoteAnimations !== undefined
      ? { disableEmoteAnimations: topLevelDisableEmoteAnimations }
      : {}),
    ...(topLevelShowTimestamp !== undefined
      ? { showTimestamp: topLevelShowTimestamp }
      : {}),
    ...(topLevelShowInlineReplyContext !== undefined
      ? { showInlineReplyContext: topLevelShowInlineReplyContext }
      : {}),
    ...(topLevelIsAlternatingRow !== undefined
      ? { isAlternatingRow: topLevelIsAlternatingRow }
      : {}),
    ...(topLevelIsHighlightedMessageTarget !== undefined
      ? { isHighlightedMessageTarget: topLevelIsHighlightedMessageTarget }
      : {}),
  } satisfies ChatMessageDisplayFlags;

  const {
    disableEmoteAnimations = false,
    isChannelPointRedemption:
      messageDisplayIsChannelPointRedemption = messageIsChannelPointRedemption,
    isAnnouncement: messageDisplayIsAnnouncement = messageIsAnnouncement,
    isHighlightedMessage:
      messageDisplayIsHighlightedMessage = messageIsHighlightedMessage,
    isSharedChatDuplicated:
      messageDisplayIsSharedChatDuplicated = messageIsSharedChatDuplicated,
    isTwitchSystemNotice:
      messageDisplayIsTwitchSystemNotice = messageIsTwitchSystemNotice,
    showInlineReplyContext = true,
    showTimestamp = true,
    isAlternatingRow = false,
    isHighlightedMessageTarget = false,
  } = messageDisplay;
  const isChannelPointRedemption = messageDisplayIsChannelPointRedemption;
  const isAnnouncement = messageDisplayIsAnnouncement;
  const isHighlightedMessage = messageDisplayIsHighlightedMessage;
  const sharedChatEnabled = usePreference('sharedChatEnabled');
  const isSharedChatDuplicated =
    messageDisplayIsSharedChatDuplicated && sharedChatEnabled;
  const isTwitchSystemNotice = messageDisplayIsTwitchSystemNotice;
  const { getMappingKey } = useMappingHelper();
  const [selectedEmoteAction, setSelectedEmoteAction] =
    useState<EmotePressData | null>(null);
  const rowLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Set from each emote's onTouchStart (which bubbles before the row's), so
  // the single row-level long-press timer can open the emote sheet without a
  // Pressable per emote — busy rows used to mount hundreds of them.
  const pressedEmotePartRef = useRef<EmotePressData | null>(null);

  useEffect(() => {
    return () => {
      setSelectedEmoteAction(null);
    };
  }, []);
  const compact = density === 'compact';
  const normalisedCurrentUsername =
    currentUsernameNormalized ?? normaliseUsername(currentUsername);
  // Identity-stable so the memoized span renderers can bail out.
  const effectiveHighlightedUserSet = useMemo(
    () =>
      highlightedUserSet ??
      new Set((highlightedUsers ?? []).map(normaliseUsername)),
    [highlightedUserSet, highlightedUsers],
  );
  const messageSenderKey = normaliseUsername(
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
    stopRowLongPressTimer();
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
  } satisfies UseChatMessagePartRendererArgs;

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

  const startRowLongPressTimer = () => {
    // Only stop the timer here: the pressed emote (if any) was just recorded
    // by the emote's own onTouchStart, which bubbles before the row's.
    stopRowLongPressTimer();
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
    (normaliseUsername(replyDisplayName) === normalisedCurrentUsername ||
      normaliseUsername(parentDisplayName) === normalisedCurrentUsername),
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
