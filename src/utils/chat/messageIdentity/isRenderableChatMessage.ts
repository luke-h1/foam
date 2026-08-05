import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

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
