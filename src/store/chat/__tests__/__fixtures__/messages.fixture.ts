import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * The store replaces token ids with part indexes, so an emote is identified
 * by the url that only the resolved emote carries.
 */
export interface TokenSummary {
  type: string;
  content?: string;
  url?: string;
}

export function summariseTokens(tokens: MessageToken[]): TokenSummary[] {
  return tokens.map(token => {
    if (token.type === 'emote') {
      return { type: token.type, content: token.content, url: token.url };
    }

    return {
      type: token.type,
      content: 'content' in token ? token.content : undefined,
    };
  });
}

export function storedMessage(messageId: string): AnyChatMessageType {
  const message = chatStore$.messages
    .peek()
    .find(entry => entry.message_id === messageId);

  if (!message) {
    throw new Error(`Message ${messageId} is not in the store`);
  }

  return message;
}

export function storedTokens(messageId: string): TokenSummary[] {
  return summariseTokens(storedMessage(messageId).message);
}

export function enrichedMessageIds(): string[] {
  return chatStore$.messages
    .peek()
    .filter(message => message.message.some(token => token.type === 'emote'))
    .map(message => message.message_id);
}
