import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

/**
 * The one composition rule for a chat message's identity; the store dedup
 * index, ingest buffer and list keyExtractor must all agree on it.
 */
export function getChatMessageKey(
  messageId: string,
  messageNonce: string,
): string {
  return `${normaliseMessageField(messageId)}_${normaliseMessageField(
    messageNonce,
  )}`;
}
