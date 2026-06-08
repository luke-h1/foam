import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import {
  channelPointsRewardTitleFromUserstate,
  channelPointsRewardTitleFromTags,
  channelPointsRewardTitleFieldsFromUserstate,
} from '@app/utils/chat/channelPointsRewardTitle';
import {
  getChannelPointRewardTitleCacheVersion,
  resolveChannelPointRewardTitle,
  subscribeChannelPointRewardTitles,
} from '@app/utils/chat/channelPointRewardTitleStore';
import { hasSharedChannelPointsMessage } from '@app/components/Chat/util/channelPointsSharedMessage';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useMappingHelper } from '@shopify/flash-list';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import type {
  EmotePressData,
  RichChatMessageProps,
} from './RichChatMessage.types';
import { getAnnouncementAccentColor } from '@app/components/Chat/util/getAnnouncementAccentColor';
import { normaliseChatUsername } from '@app/components/Chat/util/normaliseChatUsername';
import {
  getChatBodyInfo,
  getAnnouncementColorParam,
  getPartIdentity,
  isUserNoticeTags,
  resolveChatBodyVariant,
} from './richChatMessageHelpers';
import { toChatMessageData } from './richChatMessageData';

const MESSAGE_LONG_PRESS_DELAY_MS = 650;

export function useRichChatMessage<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
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
    highlightedUserSet,
    highlightedUsers,
    moderationNotice,
    onReplyContextPress,
    isChannelPointRedemption: messageIsChannelPointRedemption = false,
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
  };

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
  const isSharedChatDuplicated = messageDisplayIsSharedChatDuplicated;
  const isTwitchSystemNotice = messageDisplayIsTwitchSystemNotice;
  const { getMappingKey } = useMappingHelper();
  const rowLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const compact = density === 'compact';
  const normalisedCurrentUsername =
    currentUsernameNormalized ?? normaliseChatUsername(currentUsername);
  const fallbackHighlightedUserSet = new Set(
    (highlightedUsers ?? []).map(normaliseChatUsername),
  );
  const effectiveHighlightedUserSet =
    highlightedUserSet ?? fallbackHighlightedUserSet;
  const messageSenderKey = normaliseChatUsername(
    userstate.username || userstate.login || sender,
  );
  const isHighlightedSender =
    messageSenderKey.length > 0 &&
    effectiveHighlightedUserSet?.has(messageSenderKey);
  const getPartKey = (part: ParsedPart, index: number) =>
    getMappingKey(getPartIdentity(part, index), index);

  const handleEmotePress = (part: EmotePressData) => {
    onEmotePress?.(part);
  };

  const clearRowLongPressTimer = () => {
    if (!rowLongPressTimerRef.current) {
      return;
    }

    clearTimeout(rowLongPressTimerRef.current);
    rowLongPressTimerRef.current = null;
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
    getMentionColor,
    getPartKey,
    onEmotePreview: onEmotePress ? handleEmotePress : undefined,
    message,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags: isUserNoticeTags(notice_tags) ? notice_tags : undefined,
    parseTextForEmotes,
  };

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

  const noticeMsgId =
    notice_tags && 'msg-id' in notice_tags ? notice_tags['msg-id'] : undefined;
  const bodyVariant = resolveChatBodyVariant(detectedBodyVariant, noticeMsgId);

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
  const rewardTitleCacheVersion = useSyncExternalStore(
    subscribeChannelPointRewardTitles,
    getChannelPointRewardTitleCacheVersion,
    getChannelPointRewardTitleCacheVersion,
  );
  const rewardTitleResolved = showChannelPointsRewardChrome
    ? (() => {
        void rewardTitleCacheVersion;

        return (
          channelPointsRewardTitleFromUserstate(userstate) ??
          (isUserNoticeTags(notice_tags)
            ? channelPointsRewardTitleFromTags(notice_tags)
            : undefined) ??
          resolveChannelPointRewardTitle({
            tags: channelPointsRewardTitleFieldsFromUserstate(userstate),
            broadcasterId: roomId,
          })
        );
      })()
    : undefined;
  const rewardSummaryTitle = rewardTitleResolved ?? 'Channel Points reward';

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
    if (!canReply && !onMessageLongPress) {
      return;
    }

    clearRowLongPressTimer();
    rowLongPressTimerRef.current = setTimeout(() => {
      rowLongPressTimerRef.current = null;
      handleLongPress();
    }, MESSAGE_LONG_PRESS_DELAY_MS);
  };

  const isReply = Boolean(parentDisplayName);
  const replyParentMessageId = userstate['reply-parent-msg-id'];
  const isFirstMessage = userstate['first-msg'] === '1';
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
    compact,
    disableEmoteAnimations,
    getMappingKey,
    isAppSystemSender,
    isAnnouncement,
    isHighlightedMessage,
    isSharedChatDuplicated,
    isChannelPointRedemption,
    isFirstMessage,
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
    rewardSummaryTitle,
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
    startRowLongPressTimer,
    style: props.style,
    timestamp: props.timestamp,
    userstate,
  };
}
