import { getChatMessageKey } from '@app/utils/chat/message-identity/get-chat-message-key';
import { normaliseMessageField } from '@app/utils/chat/message-identity/normalise-message-field';

export function getChatMessageStoreId(message: {
  id?: string;
  message_id: string;
  message_nonce: string;
}): string {
  return (
    normaliseMessageField(message.id) ||
    getChatMessageKey(message.message_id, message.message_nonce)
  );
}
