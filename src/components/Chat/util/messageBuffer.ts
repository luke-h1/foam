import { chatPerfMarks } from '@app/lib/chatPerfMarks';
import { getMaxChatMessages } from '@app/store/chat/actions/messages';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { getChatMessageStoreId } from '@app/utils/chat/messageIdentity/getChatMessageStoreId';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';

import { createModeratedBufferMessage } from './bufferedMessageOps/createModeratedBufferMessage';
import { getBufferedMessageLogin } from './bufferedMessageOps/getBufferedMessageLogin';
import type { BufferedMessage } from './bufferedMessageOps/types';

export type { BufferedMessage } from './bufferedMessageOps/types';

export type AddResult = {
  /**
   * False when the message merged into an existing buffered entry (same key)
   * rather than being appended — callers skip unread/flush bookkeeping then.
   */
  added: boolean;
  /**
   * How many of the oldest entries were dropped to keep the buffer under cap.
   */
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

/**
 * The live-chat ingestion buffer: a dedup-by-key list (keyed by message id, or
 * id+nonce) with an index for O(1) updates, a cap that drops the oldest entries,
 * and the moderation/removal edits the IRC handlers apply before a message ever
 * reaches the store. It owns only data — the owning hook drives flush timing,
 * unread counting, and publishing. `getMaxBufferedMessages` is injectable so the
 * cap can be exercised without the store.
 */
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

      if (typeof existingIndex === 'number') {
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
      const normalisedMessageId = messageId.trim();
      if (!normalisedMessageId) {
        return false;
      }

      const next = messages.filter(
        message =>
          message.message_id.trim() !== normalisedMessageId &&
          message.id?.trim() !== normalisedMessageId,
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
        message => getBufferedMessageLogin(message) !== target,
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
        if (
          message.message_id.trim() !== normalisedMessageId &&
          message.id?.trim() !== normalisedMessageId
        ) {
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
        if (getBufferedMessageLogin(message) !== target) {
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
