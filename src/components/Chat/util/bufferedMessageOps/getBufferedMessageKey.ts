import { normaliseMessageId } from '@app/components/Chat/util/bufferedMessageOps/normaliseMessageId';
import type { BufferedMessage } from '@app/components/Chat/util/bufferedMessageOps/types';

export const getBufferedMessageKey = (message: BufferedMessage): string => {
  const id = message.id?.trim();
  if (id) {
    return id;
  }

  return `${normaliseMessageId(message.message_id)}_${normaliseMessageId(
    message.message_nonce,
  )}`;
};
