import { chatPerfMarks } from '@app/lib/chatPerfMarks';
import {
  getMaxChatMessages,
  getMessageSenderLogin,
} from '@app/store/chat/actions/messages';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { chatMessageMatchesId } from '@app/utils/chat/message-identity/chatMessageMatchesId';
import { getChatMessageStoreId } from '@app/utils/chat/message-identity/getChatMessageStoreId';
import { normaliseMessageField } from '@app/utils/chat/message-identity/normaliseMessageField';

import { createModeratedBufferMessage } from './buffered-message-ops/createModeratedBufferMessage';
import type { BufferedMessage } from './buffered-message-ops/types';

export type AddResult = {
  /**
   * False when the message merged into an existing entry (same key) - callers
   * skip unread/flush bookkeeping then.
   */
  added: boolean;
  dropped: number;
};

export interface MessageBuffer {
  add(message: BufferedMessage): AddResult;
  /**
   * Take the oldest buffered messages, up to `limit` when given. Anything over
   * the limit stays buffered for the next flush rather than being discarded.
   */
  drain(limit?: number): BufferedMessage[];
  clear(): void;
  size(): number;
  removeById(messageId: string): boolean;
  removeByLogin(login: string): boolean;
  moderateById(messageId: string, moderationNotice: string): void;
  moderateByLogin(login: string, moderationNotice: string): void;
}

export const createMessageBuffer = (
  getMaxBufferedMessages: () => number = getMaxChatMessages,
): MessageBuffer => {
  let messages: BufferedMessage[] = [];
  const index = new Map<string, number>();

  const rebuildIndex = (): void => {
    index.clear();
    messages.forEach((message, position) => {
      index.set(getChatMessageStoreId(message), position);
    });
  };

  return {
    add(message) {
      const key = getChatMessageStoreId(message);
      const existingIndex = index.get(key);

      if (existingIndex !== undefined) {
        const existing = messages[existingIndex];

        messages[existingIndex] = {
          ...message,
          cachedSenderColor:
            existing?.cachedSenderColor ?? message.cachedSenderColor,
        };

        return { added: false, dropped: 0 };
      }

      index.set(key, messages.length);
      messages.push(message);
      chatPerfMarks.buffered();

      const max = getMaxBufferedMessages();

      if (messages.length > max) {
        const dropped = messages.length - max;
        messages = messages.slice(-max);
        rebuildIndex();
        return { added: true, dropped };
      }

      return { added: true, dropped: 0 };
    },

    drain(limit) {
      if (limit === undefined || limit >= messages.length) {
        const drained = messages;
        messages = [];
        index.clear();
        chatPerfMarks.drained(drained.length);
        return drained;
      }

      const drained = messages.slice(0, Math.max(0, limit));
      messages = messages.slice(drained.length);
      rebuildIndex();
      chatPerfMarks.drained(drained.length);
      return drained;
    },

    clear() {
      messages = [];
      index.clear();
    },

    size() {
      return messages.length;
    },

    removeById(messageId) {
      const normalisedMessageId = normaliseMessageField(messageId);

      if (!normalisedMessageId) {
        return false;
      }

      const next = messages.filter(
        message => !chatMessageMatchesId(message, normalisedMessageId),
      );

      if (next.length === messages.length) {
        return false;
      }

      messages = next;
      rebuildIndex();
      return true;
    },

    removeByLogin(login) {
      const target = normaliseChatUsername(login);

      if (!target) {
        return false;
      }

      const next = messages.filter(
        message => getMessageSenderLogin(message) !== target,
      );

      if (next.length === messages.length) {
        return false;
      }

      messages = next;
      rebuildIndex();
      return true;
    },

    moderateById(messageId, moderationNotice) {
      const normalisedMessageId = normaliseMessageField(messageId);

      if (!normalisedMessageId) {
        return;
      }

      let nextBuffer: BufferedMessage[] | null = null;

      messages.forEach((message, position) => {
        if (!chatMessageMatchesId(message, normalisedMessageId)) {
          return;
        }

        nextBuffer ??= messages.slice();

        nextBuffer[position] = createModeratedBufferMessage(
          message,
          moderationNotice,
        );
      });

      if (nextBuffer) {
        messages = nextBuffer;
      }
    },

    moderateByLogin(login, moderationNotice) {
      const target = normaliseChatUsername(login);

      if (!target) {
        return;
      }

      let nextBuffer: BufferedMessage[] | null = null;

      messages.forEach((message, position) => {
        if (getMessageSenderLogin(message) !== target) {
          return;
        }

        nextBuffer ??= messages.slice();

        nextBuffer[position] = createModeratedBufferMessage(
          message,
          moderationNotice,
        );
      });

      if (nextBuffer) {
        messages = nextBuffer;
      }
    },
  };
};
