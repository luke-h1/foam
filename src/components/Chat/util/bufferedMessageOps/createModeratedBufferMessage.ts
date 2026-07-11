import type { BufferedMessage } from '@app/components/Chat/util/bufferedMessageOps/types';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

export const createModeratedBufferMessage = (
  message: BufferedMessage,
  moderationNotice: string,
): BufferedMessage => {
  const plainText = replaceEmotesWithText(message.message).trim();

  return {
    ...message,
    message: [
      {
        type: 'text',
        content: plainText
          ? `${plainText}—${moderationNotice}`
          : moderationNotice,
      },
    ],
    moderationNotice,
  };
};
