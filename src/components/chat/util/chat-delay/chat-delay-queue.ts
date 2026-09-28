import { createModeratedBufferMessage } from '@app/components/chat/util/buffered-message-ops/create-moderated-buffer-message';
import { getBufferedMessageLogin } from '@app/components/chat/util/buffered-message-ops/get-buffered-message-login';
import type { BufferedMessage } from '@app/components/chat/util/buffered-message-ops/types';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { normaliseMessageField } from '@app/utils/chat/message-identity/normalise-message-field';

export interface DelayedChatMessage {
  countUnread: boolean;
  message: BufferedMessage;
  releaseAt: number;
}

export interface ChatDelayQueue {
  /**
   * Returns how many of the oldest held messages were dropped to stay under
   * the ceiling.
   */
  enqueue(
    message: BufferedMessage,
    releaseAt: number,
    countUnread: boolean,
  ): number;
  maxSize(): number;
  drainDue(now: number): DelayedChatMessage[];
  drainAll(): DelayedChatMessage[];
  peekNextReleaseAt(): number | null;
  size(): number;
  clear(): void;
  removeById(messageId: string): void;
  removeByLogin(login: string): void;
  moderateById(messageId: string, moderationNotice: string): void;
  moderateByLogin(login: string, moderationNotice: string): void;
}

// Safety ceiling so a long delay + sustained chat can't grow the queue unbounded; drop oldest.
const DEFAULT_MAX_DELAYED_MESSAGES = 1000;

/**
 * Delays live chat so it lines up with the latency-delayed video; released
 * FIFO in arrival order so a mid-stream delay change can't reorder messages.
 */
export const createChatDelayQueue = (
  maxDelayedMessages = DEFAULT_MAX_DELAYED_MESSAGES,
): ChatDelayQueue => {
  let queue: DelayedChatMessage[] = [];

  return {
    enqueue(message, releaseAt, countUnread) {
      queue.push({ countUnread, message, releaseAt });

      if (queue.length > maxDelayedMessages) {
        const dropped = queue.length - maxDelayedMessages;
        queue = queue.slice(-maxDelayedMessages);
        return dropped;
      }

      return 0;
    },

    maxSize() {
      return maxDelayedMessages;
    },

    drainDue(now) {
      let dueCount = 0;

      while (dueCount < queue.length && queue[dueCount]!.releaseAt <= now) {
        dueCount += 1;
      }

      if (dueCount === 0) {
        return [];
      }

      const due = queue.slice(0, dueCount);
      queue = queue.slice(dueCount);
      return due;
    },

    drainAll() {
      const all = queue;
      queue = [];
      return all;
    },

    peekNextReleaseAt() {
      return queue.length > 0 ? queue[0]!.releaseAt : null;
    },

    size() {
      return queue.length;
    },

    clear() {
      queue = [];
    },

    removeById(messageId) {
      const target = normaliseMessageField(messageId);

      if (!target) {
        return;
      }

      queue = queue.filter(
        entry =>
          entry.message.message_id.trim() !== target &&
          entry.message.id?.trim() !== target,
      );
    },

    removeByLogin(login) {
      const target = normaliseChatUsername(login);

      if (!target) {
        return;
      }

      queue = queue.filter(
        entry => getBufferedMessageLogin(entry.message) !== target,
      );
    },

    moderateById(messageId, moderationNotice) {
      const target = normaliseMessageField(messageId);

      if (!target) {
        return;
      }

      queue = queue.map(entry =>
        entry.message.message_id.trim() === target ||
        entry.message.id?.trim() === target
          ? {
              ...entry,
              message: createModeratedBufferMessage(
                entry.message,
                moderationNotice,
              ),
            }
          : entry,
      );
    },

    moderateByLogin(login, moderationNotice) {
      const target = normaliseChatUsername(login);

      if (!target) {
        return;
      }

      queue = queue.map(entry =>
        getBufferedMessageLogin(entry.message) === target
          ? {
              ...entry,
              message: createModeratedBufferMessage(
                entry.message,
                moderationNotice,
              ),
            }
          : entry,
      );
    },
  };
};
