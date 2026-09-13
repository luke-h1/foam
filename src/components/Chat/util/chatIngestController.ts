import { startTransition } from 'react';

import { incrementChatUnread } from '@app/store/chat/actions/chatUnread';
import {
  addMessages,
  getEffectiveMaxChatMessages,
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
import { createChatDelayRamp } from './chatDelay/chatDelayRamp';
import { SCROLL_DEFERRED_FLUSH_RETRY_MS } from './chatFlushCadence/constants/deferredFlushRetry';
import { maxLiveCommitPerFlush } from './chatFlushCadence/maxLiveCommitPerFlush';
import { pickFlushDelay } from './chatFlushCadence/pickFlushDelay';
import { shouldEnterRaidFlushMode } from './chatFlushCadence/shouldEnterRaidFlushMode';
import { type BufferedMessage, createMessageBuffer } from './messageBuffer';

// Floor on delay-queue checks so a burst of releases coalesces into one drain.
const DELAY_RELEASE_MIN_INTERVAL_MS = 80;

const BUFFER_BACKPRESSURE_SIZE = 400;

const sanitiseDelayMs = (delayMs: number): number =>
  Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;

export type HandleNewMessageOptions = {
  countUnread?: boolean;
};

/**
 * All readers are getters so the controller always sees current values; the
 * React adapter points them at refs, tests at plain variables.
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

function publishBufferedMessages(messages: BufferedMessage[], burst = false) {
  if (messages.length === 0) {
    return;
  }

  const toCommit = burst
    ? messages.map(message => ({ ...message, arrivedInBurst: true }))
    : messages;

  startTransition(() => {
    addMessages(toCommit);
  });
}

/**
 * Chat ingest state machine; plain factory with no React so the adapter owns
 * its lifecycle and jest can drive it with fake timers.
 */
export function createChatIngestController(deps: ChatIngestControllerDeps) {
  // The store trims to this window on commit, so buffering more only adds parse work and lag.
  const buffer = createMessageBuffer(getEffectiveMaxChatMessages);
  const delayQueue = createChatDelayQueue();
  const delayRamp = createChatDelayRamp();

  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let delayTickTimer: ReturnType<typeof setTimeout> | null = null;
  let isFlushing = false;
  let pendingUnreadCount = 0;
  // Set when a flush sees a raid-sized batch; slows the next live flush cadence.
  let raidFlushMode = false;
  /**
   * Arrival count, not buffer size - the cap leaves a backlog, which would
   * latch raid mode on.
   */
  let arrivalsSinceFlush = 0;

  // Never above the buffer bound, or a deferred flush drops rows instead of forcing them through.
  const isBufferUnderBackpressure = () =>
    buffer.size() >=
    Math.min(BUFFER_BACKPRESSURE_SIZE, getEffectiveMaxChatMessages());

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
      // Re-entered from inside a flush (publishing fed a message back in); the drain under way covers it.
      return;
    }

    // Clear, not just forget - a timer armed for this same flush would stay pending and re-run it.
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
      const messagesToFlush = buffer.drain(
        underBackpressure
          ? undefined
          : maxLiveCommitPerFlush(
              isAtBottom,
              raidFlushMode,
              arrivalsSinceFlush,
            ),
      );
      arrivalsSinceFlush = 0;
      const shouldMaintainBottom = shouldArmBottomContentAnchor();

      const finalize = deps.getFinalizeMessageForCommit();
      publishBufferedMessages(
        finalize ? messagesToFlush.map(finalize) : messagesToFlush,
        raidFlushMode,
      );

      if (shouldMaintainBottom) {
        deps.onBottomContentChange();
      }

      drainPendingUnread();
    } finally {
      isFlushing = false;
    }

    /**
     * Re-arm for rows the cap held back, or they wait on the next incoming
     * message and stall the tail of a burst.
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

  // Shared by the direct and delayed-release paths.
  const ingestMessage = (message: BufferedMessage, countUnread?: boolean) => {
    const { added, dropped } = buffer.add(message);
    if (!added) {
      return;
    }

    arrivalsSinceFlush += 1;

    if (dropped > 0) {
      pendingUnreadCount = Math.max(0, pendingUnreadCount - dropped);
      reportDroppedChatMessages(dropped, {
        reason: 'ingest-buffer-overflow',
        bufferSize: buffer.size(),
        maxBufferedMessages: getEffectiveMaxChatMessages(),
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

  const enqueueDelayed = (message: BufferedMessage, releaseAt: number) => {
    const dropped = delayQueue.enqueue(message, releaseAt, true);
    if (dropped > 0) {
      reportDroppedChatMessages(dropped, {
        reason: 'delay-queue-overflow',
        bufferSize: delayQueue.size(),
        maxBufferedMessages: delayQueue.maxSize(),
      });
    }
    scheduleDelayTick();
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
    const delayMs =
      countUnread === false
        ? 0
        : delayRamp.resolve(sanitiseDelayMs(deps.getChatDelayMs()), Date.now());

    if (delayMs <= 0) {
      // An auto-sync delay can collapse to zero mid-stream; a live message
      // still can't skip past older ones held in the queue.
      if (countUnread !== false && delayQueue.size() > 0) {
        enqueueDelayed(messageWithCachedColor, Date.now());
        return;
      }
      ingestMessage(messageWithCachedColor, countUnread);
      return;
    }

    enqueueDelayed(messageWithCachedColor, Date.now() + delayMs);
  };

  // On delay-setting change: drain held messages if delay is off, else ensure a tick is pending.
  const reconcileChatDelay = () => {
    if (sanitiseDelayMs(deps.getChatDelayMs()) <= 0) {
      clearDelayTick();
      delayRamp.reset();
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
    delayRamp.reset();
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
