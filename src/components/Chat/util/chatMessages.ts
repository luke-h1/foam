import type { AnyChatMessageType } from './messageHandlers';

const fallbackMessageKeys = new WeakMap<object, string>();
let fallbackMessageKeyId = 0;

export function isRenderableChatMessage(
  message: AnyChatMessageType | undefined,
): message is AnyChatMessageType {
  return Boolean(message?.message_id && message.message_nonce);
}

export function getChatMessageListKey(
  message: AnyChatMessageType | undefined,
): string {
  if (isRenderableChatMessage(message)) {
    return (
      message.id?.trim() || `${message.message_id}_${message.message_nonce}`
    );
  }

  if (message && typeof message === 'object') {
    const existingKey = fallbackMessageKeys.get(message);
    if (existingKey) {
      return existingKey;
    }

    const nextKey = `invalid-message-${fallbackMessageKeyId}`;
    fallbackMessageKeyId += 1;
    fallbackMessageKeys.set(message, nextKey);
    return nextKey;
  }

  return 'missing-chat-message';
}
