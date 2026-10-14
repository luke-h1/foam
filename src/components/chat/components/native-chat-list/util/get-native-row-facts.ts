import { getAnnouncementColorParam } from '@app/components/chat/util/chat-row/get-announcement-color-param';
import { getChatBodyPresentation } from '@app/components/chat/util/chat-row/get-chat-body-presentation';
import { getReplyFlags } from '@app/components/chat/util/chat-row/get-reply-flags';
import { isUserNoticeTags } from '@app/components/chat/util/chat-row/is-user-notice-tags';
import { getAnnouncementAccentColor } from '@app/components/chat/util/get-announcement-accent-color';
import { getUserMessageColor } from '@app/store/chat/actions/messages';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { deriveChatBody } from '@app/utils/chat/derive-chat-body/derive-chat-body';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cached-lighten';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolve-cached-sender-color';

import type {
  NativeChatRowContext,
  NativeChatRowLiveState,
} from './native-row-context';

/**
 * What `useChatRow` and `ChatRowItem` derive for a React row, computed
 * without hooks.
 */
export interface NativeRowFacts {
  announcementAccentColor?: string;
  bodyVariant: ChatBodyVariant;
  customHighlightColor?: string;
  isAlternatingRow: boolean;
  isAppSystemSender: boolean;
  isChannelPointRedemption: boolean;
  isFirstMessage: boolean;
  isHighlightedMessage: boolean;
  isHighlightedMessageTarget: boolean;
  isHighlightedSender: boolean;
  isModerated: boolean;
  isReplyingToCurrentUser: boolean;
  isReturningChatter: boolean;
  isSharedChatDuplicated: boolean;
  isUserChat: boolean;
  mentionsCurrentUser: boolean;
  noticeMsgId?: string;
  noticeTags?: UserNoticeTags;

  /**
   * The sender's 7TV paint from the store. A painted row lays out as a
   * stacked line even when the paint renderer is off.
   */
  paint: PaintData | null;
  replyParentMessageId?: string;
  roomId?: string;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;

  /**
   * The colour an unpainted username and an action body draw in.
   */
  usernameColor?: string;
}

function getRowNoticeTags(
  message: AnyChatMessageType,
): UserNoticeTags | undefined {
  const tags = 'notice_tags' in message ? message.notice_tags : undefined;
  return isUserNoticeTags(tags) ? tags : undefined;
}

export function getSenderPaint(
  message: AnyChatMessageType,
  live: NativeChatRowLiveState,
): PaintData | null {
  const userId = message.userstate['user-id'];

  if (!userId) {
    return null;
  }

  const paintId = live.userPaintIds[userId];
  return (paintId && live.paints[paintId]) || null;
}

export function isHighlightedReplyTarget(
  message: AnyChatMessageType,
  live: NativeChatRowLiveState,
): boolean {
  return (
    live.highlightedReplyTargetId !== null &&
    live.highlightedReplyTargetId === message.message_id
  );
}

function getUsernameColor(message: AnyChatMessageType): string | undefined {
  const { username, color } = message.userstate;

  return (
    message.cachedSenderColor ??
    resolveCachedSenderColor(message, getUserMessageColor) ??
    (color ? cachedLighten(color) : undefined) ??
    (username ? cachedLighten(generateRandomTwitchColor(username)) : undefined)
  );
}

export function getNativeRowFacts(
  message: AnyChatMessageType,
  context: NativeChatRowContext,
  live: NativeChatRowLiveState,
): NativeRowFacts {
  const { userstate } = message;
  const noticeTags = getRowNoticeTags(message);
  const noticeMsgId = noticeTags?.['msg-id'];
  const isChannelPointRedemption = Boolean(message.isChannelPointRedemption);
  const isHighlightedMessage = Boolean(message.isHighlightedMessage);

  const { mentionsCurrentUser, variant: detectedBodyVariant } = deriveChatBody(
    message.message,
    {
      currentUsername: context.currentUsernameNormalized,
      isAnnouncement: Boolean(message.isAnnouncement),
      isTwitchSystemNotice: Boolean(message.isTwitchSystemNotice),
      sender: message.sender,
    },
  );

  const presentation = getChatBodyPresentation({
    customHighlights: context.customHighlights,
    detectedBodyVariant,
    isChannelPointRedemption,
    isHighlightedMessage,
    message: message.message,
    moderationNotice: message.moderationNotice,
    noticeMsgId,
    userstate,
  });

  const replyFlags = getReplyFlags({
    normalisedCurrentUsername: context.currentUsernameNormalized,
    onReplyContextPress: undefined,
    parentDisplayName: message.parentDisplayName,
    replyBody: message.replyBody,
    replyDisplayName: message.replyDisplayName,
    showInlineReplyContext: context.showInlineReplyContext,
    userstate,
  });

  const senderKey = normaliseChatUsername(
    userstate.username || userstate.login || message.sender,
  );

  const roomId = userstate['room-id'];

  return {
    announcementAccentColor: message.isAnnouncement
      ? getAnnouncementAccentColor(getAnnouncementColorParam(noticeTags))
      : undefined,
    bodyVariant: presentation.bodyVariant,
    customHighlightColor: presentation.customHighlightColor,
    isAlternatingRow:
      context.showAlternatingChatRows && (message.seq ?? 0) % 2 === 1,
    isAppSystemSender: presentation.isAppSystemSender,
    isChannelPointRedemption,
    isFirstMessage: replyFlags.isFirstMessage,
    isHighlightedMessage,
    isHighlightedMessageTarget: isHighlightedReplyTarget(message, live),
    isHighlightedSender:
      senderKey.length > 0 && context.highlightedUserSet.has(senderKey),
    isModerated: Boolean(message.moderationNotice),
    isReplyingToCurrentUser: replyFlags.isReplyingToCurrentUser,
    isReturningChatter: replyFlags.isReturningChatter,
    isSharedChatDuplicated:
      Boolean(message.isSharedChatDuplicated) && context.sharedChatEnabled,
    isUserChat: presentation.isUserChat,
    mentionsCurrentUser,
    noticeMsgId,
    noticeTags,
    paint: getSenderPaint(message, live),
    replyParentMessageId: replyFlags.replyParentMessageId,
    roomId: String(roomId) === roomId ? roomId : context.channelId,
    shouldRenderInlineReply: replyFlags.shouldRenderInlineReply,
    showChannelPointsRewardChrome: presentation.showChannelPointsRewardChrome,
    usernameColor: getUsernameColor(message),
  };
}
