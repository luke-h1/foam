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
 * The list asks for a row's type several times per row (container render,
 * size estimation, container allocation) and the collaborators are all
 * WeakMap-cached already - this memoises the composed string per message and
 * inline-reply setting so repeat calls are a Map hit.
 */
const itemTypeWithReplyContext = new WeakMap<AnyChatMessageType, string>();
const itemTypeWithoutReplyContext = new WeakMap<AnyChatMessageType, string>();

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

  const cache =
    options?.showInlineReplyContext !== false
      ? itemTypeWithReplyContext
      : itemTypeWithoutReplyContext;
  const cached = cache.get(item);
  if (cached !== undefined) {
    return cached;
  }

  let itemType: string;
  if (item.sender?.toLowerCase() === 'system') {
    itemType = 'system-notice';
  } else {
    const bodyVariant = resolveBodyVariant(item);
    itemType =
      bodyVariant !== 'user_chat'
        ? `${bodyVariant}-${getChatRowSizeBucket(item)}`
        : getUserChatRowItemType(item, options);
  }

  cache.set(item, itemType);
  return itemType;
}
