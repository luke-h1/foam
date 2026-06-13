import type { AnyChatMessageType } from '../types/constants';

const messageColorIndex = new Map<string, string>();
const senderColorIndex = new Map<string, string>();

const normaliseIndexKey = (value?: string): string | null => {
  const normalised = value?.trim().toLowerCase();
  return normalised || null;
};

export const indexMessageColor = (message: AnyChatMessageType): void => {
  if (message.userstate?.color && message.message_id) {
    messageColorIndex.set(message.message_id, message.userstate.color);
  }

  const color = message.userstate?.color;
  if (!color) {
    return;
  }

  const senderKeys = [
    normaliseIndexKey(message.sender),
    normaliseIndexKey(message.userstate?.username),
    normaliseIndexKey(message.userstate?.login),
    normaliseIndexKey(
      typeof message.userstate?.['display-name'] === 'string'
        ? message.userstate['display-name']
        : undefined,
    ),
  ];

  senderKeys.forEach(senderKey => {
    if (senderKey) {
      senderColorIndex.set(senderKey, color);
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
