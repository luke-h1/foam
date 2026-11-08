import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

export interface ChatMessagesSource {
  peek: () => AnyChatMessageType[];
}
