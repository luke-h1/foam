import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { normaliseMessageField } from '@app/utils/chat/message-identity/normaliseMessageField';

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
