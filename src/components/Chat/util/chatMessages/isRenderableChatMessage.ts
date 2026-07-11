import { normaliseMessageField } from '@app/components/Chat/util/chatMessages/normaliseMessageField';
import type { AnyChatMessageType } from '@app/components/Chat/util/messageHandlers';

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
