import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

export type BufferedMessage = AnyChatMessageType & {
  cachedSenderColor?: string;
};
