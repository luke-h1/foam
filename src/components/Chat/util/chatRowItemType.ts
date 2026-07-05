import {
  type ChatBodyVariant,
  getChatBodyInfo,
} from '@app/components/Chat/util/richChatMessageHelpers';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

import { hasSharedChannelPointsMessage } from './channelPointsSharedMessage';
import { isRenderableChatMessage } from './chatMessages';
import type { AnyChatMessageType } from './messageHandlers';

export interface ChatRowItemTypeOptions {
  showInlineReplyContext?: boolean;
}

// getItemType runs per row on every list data change, so cache the two-peek
// observable traversal per user and invalidate when the cosmetic maps change.
const userPaintFlagCache = new Map<string, boolean>();
let paintCacheInvalidatorAttached = false;

function ensurePaintCacheInvalidator(): void {
  if (paintCacheInvalidatorAttached) {
    return;
  }
  paintCacheInvalidatorAttached = true;
  chatStore$.userPaintIds.onChange(() => userPaintFlagCache.clear());
  chatStore$.paints.onChange(() => userPaintFlagCache.clear());
}

function hasUserPaint(userId?: string): boolean {
  if (!userId) {
    return false;
  }

  ensurePaintCacheInvalidator();

  const cached = userPaintFlagCache.get(userId);
  if (cached !== undefined) {
    return cached;
  }

  const paintId = chatStore$.userPaintIds[userId]?.peek();
  const result = Boolean(paintId && chatStore$.paints[paintId]?.peek());
  userPaintFlagCache.set(userId, result);
  return result;
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
