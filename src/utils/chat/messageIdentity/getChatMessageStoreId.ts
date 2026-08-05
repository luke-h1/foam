import { getChatMessageKey } from '@app/utils/chat/messageIdentity/getChatMessageKey';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

/**
 * A message's stable id: the store-assigned `id` once it has been committed,
 * falling back to the key it will be committed under. Buffered (pre-commit)
 * and stored messages therefore answer to the same identity, so `id` is
 * optional here even though the committed type requires it.
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
