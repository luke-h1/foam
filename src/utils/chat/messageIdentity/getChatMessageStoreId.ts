import { getChatMessageKey } from '@app/utils/chat/messageIdentity/getChatMessageKey';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

/**
 * A message's stable id: the store-assigned `id` once committed, else the key
 * it commits under - buffered and stored messages share one identity.
 */
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
