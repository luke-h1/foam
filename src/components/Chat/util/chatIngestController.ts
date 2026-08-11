import { startTransition } from 'react';

import { incrementChatUnread } from '@app/store/chat/actions/chatUnread';
import {
  addMessages,
  getMessageById,
  getUserMessageColor,
  moderateMessageById,
  moderateMessagesByLogin,
  removeMessageById,
  removeMessagesByLogin,
} from '@app/store/chat/actions/messages';
import {
  reportDroppedChatMessages,
  resetDroppedChatMessageReports,
} from '@app/utils/chat/chatHealth/reportDroppedChatMessages';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor/resolveCachedSenderColor';

import { createChatDelayQueue } from './chatDelay/chatDelayQueue';
import { SCROLL_DEFERRED_FLUSH_RETRY_MS } from './chatFlushCadence/constants/deferredFlushRetry';
import { maxLiveCommitPerFlush } from './chatFlushCadence/maxLiveCommitPerFlush';
import { pickFlushDelay } from './chatFlushCadence/pickFlushDelay';
import { shouldEnterRaidFlushMode } from './chatFlushCadence/shouldEnterRaidFlushMode';
import { type BufferedMessage, createMessageBuffer } from './messageBuffer';

// Floor on delay-queue checks so a burst of releases coalesces into one drain.
const DELAY_RELEASE_MIN_INTERVAL_MS = 80;

const INGEST_BUFFER_CAPACITY = 1000;
const BUFFER_BACKPRESSURE_SIZE = 400;

export type HandleNewMessageOptions = {
  countUnread?: boolean;
};

/**
 * Everything the ingest controller must know about the world outside it.
 * All readers are getters so the controller always sees current values;
 * the React adapter points them at refs it refreshes per render, and a
 * headless test points them at plain variables.
 */
export interface ChatIngestControllerDeps {
  /**
   * Applied to each message as it leaves the buffer for the store, so the
   * live path can defer emote/badge parsing to commit time.
   */
  getFinalizeMessageForCommit: () =>
    ((message: BufferedMessage) => BufferedMessage) | undefined;
  /**
   * Hold live messages this many ms before the render buffer (0 = no delay).
   */
  getChatDelayMs: () => number;
  isAtBottom: () => boolean;
  isScrollingToBottom: () => boolean;
  isUserActivelyScrolling: () => boolean;
  onBottomContentChange: () => void;
}

function publishBufferedMessages(messages: BufferedMessage[]) {
  if (messages.length === 0) {
    return;
  }

  startTransition(() => {
    addMessages(messages);
  });
}

/**
 * The chat ingest state machine: buffer, delay queue, flush cadence, raid
 * latch, backpressure and unread accounting, moderation coherence across the
 * three holding areas. Plain factory with no React - the `useChatMessages`
 * adapter owns its lifecycle in the component tree, and jest can drive a raw
 * line all the way into the real store with fake timers.
 */
export function createChatIngestController(deps: ChatIngestControllerDeps) {
  const buffer = createMessageBuffer(() => INGEST_BUFFER_CAPACITY);
  const delayQueue = createChatDelayQueue();

  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let delayTickTimer: ReturnType<typeof setTimeout> | null = null;
  let isFlushing = false;
  let pendingUnreadCount = 0;
  // Set when a flush sees a raid-sized batch; slows the next live flush cadence.
  let raidFlushMode = false;
  /**
   * Arrivals since the last flush. Must be the arrival count, not the buffer
   * size - the cap leaves a backlog behind, which would latch raid mode on.
   */
  let arrivalsSinceFlush = 0;

  const isBufferUnderBackpressure = () =>
    buffer.size() >= BUFFER_BACKPRESSURE_SIZE;

  const shouldArmBottomContentAnchor = () => deps.isScrollingToBottom();

  const startFlushTimer = (delayMs: number) => {
    if (flushTimer) {
      return;
    }

    flushTimer = setTimeout(() => {
      flushBuffer();
    }, delayMs);
  };

  const drainPendingUnread = () => {
    if (pendingUnreadCount > 0) {
      incrementChatUnread(pendingUnreadCount);
      pendingUnreadCount = 0;
    }
  };

  const flushBuffer = () => {
    if (isFlushing) {
      // Re-entered from inside a flush, because publishing fed a message
      // straight back in. The drain already under way covers it, so leave any
      // armed timer alone rather than dropping its handle.
      return;
    }

    // Clearing (not just forgetting) matters on the direct-call path: a timer
    // armed for this same flush would otherwise stay pending and re-run it.
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (buffer.size() === 0) {
      drainPendingUnread();
      return;
    }
    const underBackpressure = isBufferUnderBackpressure();

    if (!underBackpressure && deps.isUserActivelyScrolling()) {
      flushTimer = setTimeout(() => {
        flushBuffer();
      }, SCROLL_DEFERRED_FLUSH_RETRY_MS);
      return;
    }

    isFlushing = true;
    try {
      const isAtBottom = deps.isAtBottom();
      raidFlushMode = shouldEnterRaidFlushMode(arrivalsSinceFlush, isAtBottom);
      arrivalsSinceFlush = 0;
      const messagesToFlush = buffer.drain(
        underBackpressure
          ? undefined
          : maxLiveCommitPerFlush(isAtBottom, raidFlushMode),
      );
      const shouldMaintainBottom = shouldArmBottomContentAnchor();

      const finalize = deps.getFinalizeMessageForCommit();
      publishBufferedMessages(
        finalize ? messagesToFlush.map(finalize) : messagesToFlush,
      );

      if (shouldMaintainBottom) {
        deps.onBottomContentChange();
      }

      drainPendingUnread();
    } finally {
      isFlushing = false;
    }

    /**
     * Rows the per-flush cap held back; without re-arming they would wait on
     * the next incoming message, which stalls the tail end of a burst.
     */
    if (buffer.size() > 0) {
      startFlushTimer(
        pickFlushDelay({
          isAtBottom: deps.isAtBottom(),
          raidMode: raidFlushMode,
          scrollingToBottom: deps.isScrollingToBottom(),
        }),
      );
    }
  };

  const clearDelayTick = () => {
    if (delayTickTimer) {
      clearTimeout(delayTickTimer);
      delayTickTimer = null;
    }
  };

  // Commit one message into the render buffer + run unread/flush bookkeeping
  // (shared by the direct and delayed-release paths).
  const ingestMessage = (message: BufferedMessage, countUnread?: boolean) => {
    const { added, dropped } = buffer.add(message);
    if (!added) {
      return;
    }

    arrivalsSinceFlush += 1;

    if (dropped > 0) {
      pendingUnreadCount = Math.max(0, pendingUnreadCount - dropped);
      reportDroppedChatMessages(dropped, {
        bufferSize: buffer.size(),
        maxBufferedMessages: INGEST_BUFFER_CAPACITY,
      });
    }

    const scrollingToBottom = deps.isScrollingToBottom();
    if (countUnread !== false && !deps.isAtBottom() && !scrollingToBottom) {
      pendingUnreadCount += 1;
    }

    if (isBufferUnderBackpressure()) {
      flushBuffer();
    }

    startFlushTimer(
      pickFlushDelay({
        isAtBottom: deps.isAtBottom(),
        raidMode: raidFlushMode,
        scrollingToBottom,
      }),
    );
  };

  const runDelayTick = () => {
    delayTickTimer = null;
    const due = delayQueue.drainDue(Date.now());
    due.forEach(entry => ingestMessage(entry.message, entry.countUnread));
    scheduleDelayTick();
  };

  const scheduleDelayTick = () => {
    if (delayTickTimer) {
      return;
    }
    const nextReleaseAt = delayQueue.peekNextReleaseAt();
    if (nextReleaseAt == null) {
      return;
    }
    const wait = Math.max(
      DELAY_RELEASE_MIN_INTERVAL_MS,
      nextReleaseAt - Date.now(),
    );
    delayTickTimer = setTimeout(runDelayTick, wait);
  };

  const handleNewMessage = (
    newMessage: BufferedMessage,
    messageOptions?: HandleNewMessageOptions,
  ) => {
    const messageWithCachedColor = {
      ...newMessage,
      cachedSenderColor: resolveCachedSenderColor(
        newMessage,
        getUserMessageColor,
      ),
    };

    const countUnread = messageOptions?.countUnread;
    // Historical replay (countUnread === false) is already old, so it bypasses the delay.
    const rawDelayMs = countUnread === false ? 0 : deps.getChatDelayMs();
    const delayMs =
      Number.isFinite(rawDelayMs) && rawDelayMs > 0 ? rawDelayMs : 0;

    if (delayMs <= 0) {
      // An auto-sync delay can collapse to zero mid-stream; a live message
      // still can't skip past older ones held in the queue.
      if (countUnread !== false && delayQueue.size() > 0) {
        delayQueue.enqueue(messageWithCachedColor, Date.now(), true);
        scheduleDelayTick();
        return;
      }
      ingestMessage(messageWithCachedColor, countUnread);
      return;
    }

    delayQueue.enqueue(
      messageWithCachedColor,
      Date.now() + delayMs,
      countUnread !== false,
    );
    scheduleDelayTick();
  };

  // On delay-setting change: drain everything held if delay is off, else
  // ensure a tick is pending.
  const reconcileChatDelay = () => {
    const effectiveDelayMs = deps.getChatDelayMs();
    if (!Number.isFinite(effectiveDelayMs) || effectiveDelayMs <= 0) {
      clearDelayTick();
      delayQueue
        .drainAll()
        .forEach(entry => ingestMessage(entry.message, entry.countUnread));
      return;
    }
    scheduleDelayTick();
  };

  const forceFlush = () => {
    if (buffer.size() === 0) {
      return;
    }

    const bufferedMessages = buffer.drain();
    const shouldMaintainBottom = shouldArmBottomContentAnchor();

    const finalize = deps.getFinalizeMessageForCommit();
    publishBufferedMessages(
      finalize ? bufferedMessages.map(finalize) : bufferedMessages,
    );

    if (shouldMaintainBottom) {
      deps.onBottomContentChange();
    }

    drainPendingUnread();
  };

  const clearLocalMessages = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    buffer.clear();
    delayQueue.clear();
    clearDelayTick();
    pendingUnreadCount = 0;
    arrivalsSinceFlush = 0;
    raidFlushMode = false;
  };

  /**
   * One call per moderation event: each handler hits the ingest buffer, the
   * delay queue and the committed store so the halves cannot drift.
   */
  const removeChatMessageById = (messageId: string) => {
    buffer.removeById(messageId);
    delayQueue.removeById(messageId);
    removeMessageById(messageId);
  };

  const removeChatMessagesByLogin = (login: string) => {
    buffer.removeByLogin(login);
    delayQueue.removeByLogin(login);
    removeMessagesByLogin(login);
  };

  const moderateChatMessageById = (
    messageId: string,
    moderationNotice: string,
  ) => {
    buffer.moderateById(messageId, moderationNotice);
    delayQueue.moderateById(messageId, moderationNotice);

    if (getMessageById(messageId)) {
      moderateMessageById(messageId, moderationNotice);
      return;
    }

    removeChatMessageById(messageId);
  };

  const moderateChatMessagesByLogin = (
    login: string,
    moderationNotice: string,
  ) => {
    buffer.moderateByLogin(login, moderationNotice);
    delayQueue.moderateByLogin(login, moderationNotice);
    moderateMessagesByLogin(login, moderationNotice);
  };

  const cleanup = () => {
    clearLocalMessages();
    resetDroppedChatMessageReports();
  };

  const getBufferSize = () => buffer.size();

  return {
    handleNewMessage,
    clearLocalMessages,
    reconcileChatDelay,
    removeChatMessageById,
    removeChatMessagesByLogin,
    moderateChatMessageById,
    moderateChatMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize,
  };
}

export type ChatIngestController = ReturnType<
  typeof createChatIngestController
>;
