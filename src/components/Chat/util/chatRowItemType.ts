import { getChatBodyInfo } from '@app/components/Chat/util/richChatMessage/getChatBodyInfo';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { ChatBodyVariant } from '@app/utils/chat/deriveChatBody/types';
import { isRenderableChatMessage } from '@app/utils/chat/messageIdentity/isRenderableChatMessage';

import { hasSharedChannelPointsMessage } from './channelPointsSharedMessage';
import { getChatRowSizeBucket } from './chatRowSizeBucket';

export interface ChatRowItemTypeOptions {
  showInlineReplyContext?: boolean;
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

  /**
   * The list lays an unmeasured row out at the running average of its item
   * type, so one `user_chat` type averages a one-line "gg" with an eight-line
   * copypasta and the over-estimated rows leave unpainted background behind.
   */
  flags.push(getChatRowSizeBucket(item));

  return `user_chat-${flags.join('-')}`;
}

/**
 * The row's recycling identity, which the list treats as fixed once the row is
 * placed. Every flag must come from the message itself, never from
 * asynchronously resolved state such as a 7TV paint.
 */
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
    return `${bodyVariant}-${getChatRowSizeBucket(item)}`;
  }

  return getUserChatRowItemType(item, options);
}
