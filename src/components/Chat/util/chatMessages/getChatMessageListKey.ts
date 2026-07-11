import { isRenderableChatMessage } from '@app/components/Chat/util/chatMessages/isRenderableChatMessage';
import { normaliseMessageField } from '@app/components/Chat/util/chatMessages/normaliseMessageField';
import type { AnyChatMessageType } from '@app/components/Chat/util/messageHandlers';

const fallbackMessageKeys = new WeakMap<object, string>();
let fallbackMessageKeyId = 0;

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
