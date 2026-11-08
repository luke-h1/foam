import { getChatMessageKey } from '@app/utils/chat/message-identity/getChatMessageKey';

export interface MessageIdentity {
  id: string;
  message_id: string;
  message_nonce: string;
}

/**
 * The identity fields every message factory writes. Build them here so the
 * store `id` always comes from `getChatMessageKey`.
 */
export function createMessageIdentity(
  messageId: string,
  messageNonce: string,
): MessageIdentity {
  return {
    id: getChatMessageKey(messageId, messageNonce),
    message_id: messageId,
    message_nonce: messageNonce,
  };
}
