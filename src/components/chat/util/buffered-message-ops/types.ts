import type { AnyChatMessageType } from '@app/store/chat/types/constants';

export type BufferedMessage = AnyChatMessageType & {
  cachedSenderColor?: string;
};
