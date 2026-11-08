import { getChatMessageKey } from '@app/utils/chat/message-identity/getChatMessageKey';

export interface MessageIdentity {
  id: string;
  message_id: string;
  message_nonce: string;
}

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
