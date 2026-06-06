import { chatStore$ } from '@app/store/chatStore/state';
import { hasSharedChannelPointsMessage } from '@app/components/Chat/util/channelPointsSharedMessage';
import {
  getChatBodyInfo,
  type ChatBodyVariant,
} from '../components/ChatMessage/richChatMessageHelpers';
import { isRenderableChatMessage } from './chatMessages';
import type { AnyChatMessageType } from './messageHandlers';

export interface ChatRowItemTypeOptions {
  showInlineReplyContext?: boolean;
}

function hasUserPaint(userId?: string): boolean {
  if (!userId) {
    return false;
  }

  const paintId = chatStore$.userPaintIds[userId]?.peek();
  return Boolean(paintId && chatStore$.paints[paintId]?.peek());
}

function resolveBodyVariant(item: AnyChatMessageType): ChatBodyVariant {
  const { variant } = getChatBodyInfo(
    item.message,
    undefined,
    item.sender,
    item.isTwitchSystemNotice,
    item.isAnnouncement,
  );

  const noticeMsgId =
    item.notice_tags && 'msg-id' in item.notice_tags
      ? item.notice_tags['msg-id']
      : undefined;

  if (
    variant === 'twitch_system_notice' &&
    (noticeMsgId === 'raid' || noticeMsgId === 'unraid')
  ) {
    return 'raid';
  }

  return variant;
}

function getUserChatRowItemType(
  item: AnyChatMessageType,
  options?: ChatRowItemTypeOptions,
): string {
  const flags: string[] = [];

  if (item.moderationNotice) {
    flags.push('mod');
  }

  const parentDisplayName = item.parentDisplayName;
  const replyBody = item.replyBody;
  const showInlineReply =
    options?.showInlineReplyContext !== false &&
    Boolean(parentDisplayName) &&
    Boolean(replyBody || parentDisplayName);
  if (showInlineReply) {
    flags.push('reply');
  }

  if (item.userstate?.['first-msg'] === '1') {
    flags.push('first');
  }

  if (
    item.isChannelPointRedemption &&
    hasSharedChannelPointsMessage(item.message)
  ) {
    flags.push('cp');
  } else if (item.isHighlightedMessage && item.userstate?.username) {
    flags.push('highlight');
  }

  if (item.isSharedChatDuplicated) {
    flags.push('shared');
  }

  const userId = item.userstate?.['user-id'];
  if (hasUserPaint(userId)) {
    flags.push('paint');
  }

  return flags.length > 0 ? `user_chat-${flags.join('-')}` : 'user_chat';
}

export function getChatRowItemType(
  item: AnyChatMessageType,
  options?: ChatRowItemTypeOptions,
): string {
  if (!isRenderableChatMessage(item)) {
    return 'invalid';
  }

  if (item.sender?.toLowerCase() === 'system') {
    return 'system-notice';
  }

  const bodyVariant = resolveBodyVariant(item);
  if (bodyVariant !== 'user_chat') {
    return bodyVariant;
  }

  return getUserChatRowItemType(item, options);
}
