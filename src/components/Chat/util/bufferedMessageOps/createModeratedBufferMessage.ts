import type { BufferedMessage } from '@app/components/Chat/util/bufferedMessageOps/types';
import { createModeratedMessageText } from '@app/utils/chat/createModeratedMessageText';

export const createModeratedBufferMessage = (
  message: BufferedMessage,
  moderationNotice: string,
): BufferedMessage => ({
  ...message,
  message: [
    {
      type: 'text',
      content: createModeratedMessageText(message.message, moderationNotice),
    },
  ],
  moderationNotice,
});
