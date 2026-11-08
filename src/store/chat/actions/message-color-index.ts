import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

const messageColorIndex = new Map<string, string>();
const senderColorIndex = new Map<string, string>();

const MAX_SENDER_COLOR_ENTRIES = 5000;

const normaliseIndexKey = (value?: string): string | null =>
  normaliseChatUsername(value) || null;

export const indexMessageColor = (message: AnyChatMessageType): void => {
  const color = message.userstate?.color;

  if (!color) {
    return;
  }

  if (message.message_id) {
    messageColorIndex.set(message.message_id, color);
  }

  const senderKeys = [
    normaliseIndexKey(message.sender),
    normaliseIndexKey(message.userstate?.username),
    normaliseIndexKey(message.userstate?.login),
    normaliseIndexKey(message.userstate?.['display-name']),
  ];

  senderKeys.forEach(senderKey => {
    if (senderKey) {
      setBoundedMapEntry(
        senderColorIndex,
        senderKey,
        color,
        MAX_SENDER_COLOR_ENTRIES,
        { trimFraction: 0.2 },
      );
    }
  });
};

export const removeMessageColor = (messageId: string): void => {
  messageColorIndex.delete(messageId);
};

export const clearMessageColorIndexes = (): void => {
  messageColorIndex.clear();
  senderColorIndex.clear();
};

export const getMessageColor = (messageId: string): string | undefined =>
  messageColorIndex.get(messageId);

export const getUserMessageColor = (username: string): string | undefined => {
  const key = normaliseIndexKey(username);
  return key ? senderColorIndex.get(key) : undefined;
};
