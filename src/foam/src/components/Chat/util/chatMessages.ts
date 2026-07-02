import type { AnyChatMessageType } from './messageHandlers';

const fallbackMessageKeys = new WeakMap<object, string>();
let fallbackMessageKeyId = 0;

function normaliseMessageField(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function isRenderableChatMessage(
  message: AnyChatMessageType | undefined,
): message is AnyChatMessageType {
  if (!message) {
    return false;
  }

  return Boolean(
    normaliseMessageField(message.message_id) &&
    normaliseMessageField(message.message_nonce),
  );
}

export function getChatMessageListKey(
  message: AnyChatMessageType | undefined,
): string {
  const id = normaliseMessageField(message?.id);
  if (id) {
    return id;
  }

  if (isRenderableChatMessage(message)) {
    return `${normaliseMessageField(message.message_id)}_${normaliseMessageField(
      message.message_nonce,
    )}`;
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
