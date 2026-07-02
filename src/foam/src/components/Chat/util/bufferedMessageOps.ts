import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

export type BufferedMessage = AnyChatMessageType & {
  cachedSenderColor?: string;
};

export const normaliseMessageId = (value: string): string => value.trim();

export const normaliseLogin = (value?: string): string =>
  value?.trim().toLowerCase() ?? '';

export const getBufferedMessageLogin = (message: BufferedMessage): string =>
  normaliseLogin(
    message.userstate?.login || message.userstate?.username || message.sender,
  );

export const getBufferedMessageKey = (message: BufferedMessage): string => {
  const id = message.id?.trim();
  if (id) {
    return id;
  }

  return `${normaliseMessageId(message.message_id)}_${normaliseMessageId(
    message.message_nonce,
  )}`;
};

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
