import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getChatMessageKey } from '@app/utils/chat/messageIdentity/getChatMessageKey';
import { isRenderableChatMessage } from '@app/utils/chat/messageIdentity/isRenderableChatMessage';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

const fallbackMessageKeys = new WeakMap<object, string>();
let fallbackMessageKeyId = 0;

function isMessageObject(
  message: AnyChatMessageType | undefined,
): message is AnyChatMessageType {
  return Object(message) === message;
}

/**
 * Unlike `getChatMessageStoreId` this hands unrenderable messages a stable
 * unique fallback - two malformed rows must not share a React key.
 */
export function getChatMessageListKey(
  message: AnyChatMessageType | undefined,
): string {
  const id = normaliseMessageField(message?.id);
  if (id) {
    return id;
  }

  if (isRenderableChatMessage(message)) {
    return getChatMessageKey(message.message_id, message.message_nonce);
  }

  if (isMessageObject(message)) {
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
