import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

/**
 * The one composition rule for a chat message's identity. The store's dedup
 * index, the ingest buffer and the list's keyExtractor all key off this, and
 * ChatMessagePane drops its render-time dedup on the strength of them
 * agreeing - so the rule lives here once rather than in each of them.
 */
export function getChatMessageKey(
  messageId: string,
  messageNonce: string,
): string {
  return `${normaliseMessageField(messageId)}_${normaliseMessageField(
    messageNonce,
  )}`;
}
