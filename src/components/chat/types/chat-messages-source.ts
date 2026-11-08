import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

/**
 * A read-only view of the message list. `Chat` passes `chatStore$.messages`;
 * tests pass a stub.
 */
export interface ChatMessagesSource {
  peek: () => AnyChatMessageType[];
}
