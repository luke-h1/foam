import { normaliseMessageField } from '@app/utils/chat/message-identity/normaliseMessageField';

/**
 * A moderation or removal target id can be the IRC `message_id` or the
 * store-assigned `id`, so a match tests both. `targetId` must already be
 * normalised by the caller with `normaliseMessageField`.
 */
export function chatMessageMatchesId(
  message: { message_id: string; id?: string },
  targetId: string,
): boolean {
  return (
    normaliseMessageField(message.message_id) === targetId ||
    normaliseMessageField(message.id) === targetId
  );
}
