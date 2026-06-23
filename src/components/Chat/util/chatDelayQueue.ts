import {
  type BufferedMessage,
  createModeratedBufferMessage,
  getBufferedMessageLogin,
  normaliseLogin,
  normaliseMessageId,
} from './bufferedMessageOps';

export interface DelayedChatMessage {
  countUnread: boolean;
  message: BufferedMessage;
  releaseAt: number;
}

export interface ChatDelayQueue {
  enqueue(
    message: BufferedMessage,
    releaseAt: number,
    countUnread: boolean,
  ): void;
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

// Safety ceiling so a long delay + sustained chat can't grow the queue without
// bound. The live-ingest rate limiter caps arrivals at ~30/s, so this only bites
// at a ~33s+ delay; dropping the oldest then is the same "newest matters when
// following live" trade the flush sampler already makes.
const DEFAULT_MAX_DELAYED_MESSAGES = 1000;

/**
 * Holds live chat messages for a chosen delay before they enter the render
 * buffer, so chat can be lined up with the latency-delayed video (Frosty's
 * chat-delay model). Entries keep their arrival order and are released FIFO:
 * the head is released once its own `releaseAt` is due, and the scan stops at
 * the first not-yet-due entry. Releasing in arrival order (rather than strictly
 * by `releaseAt`) means a mid-stream delay change can never reorder messages.
 *
 * Moderation/removal mirror {@link createMessageBuffer} so a delete or timeout
 * arriving while its target is still held isn't missed — the held copy is
 * edited or dropped before it is ever shown.
 */
export const createChatDelayQueue = (
  maxDelayedMessages = DEFAULT_MAX_DELAYED_MESSAGES,
): ChatDelayQueue => {
  let queue: DelayedChatMessage[] = [];

  return {
    enqueue(message, releaseAt, countUnread) {
      queue.push({ countUnread, message, releaseAt });
      if (queue.length > maxDelayedMessages) {
        queue = queue.slice(-maxDelayedMessages);
      }
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
      const target = normaliseMessageId(messageId);
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
      const target = normaliseLogin(login);
      if (!target) {
        return;
      }
      queue = queue.filter(
        entry => getBufferedMessageLogin(entry.message) !== target,
      );
    },

    moderateById(messageId, moderationNotice) {
      const target = normaliseMessageId(messageId);
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
      const target = normaliseLogin(login);
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
