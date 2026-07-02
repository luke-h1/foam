import {
  MutableRefObject,
  startTransition,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import {
  addMessages,
  getUserMessageColor,
} from '@app/store/chat/actions/messages';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';

import { createChatDelayQueue } from '../util/chatDelayQueue';
import {
  pickFlushDelay,
  sampleLiveCommit,
  SCROLL_DEFERRED_FLUSH_RETRY_MS,
  shouldEnterRaidFlushMode,
} from '../util/chatFlushCadence';
import {
  type BufferedMessage,
  createMessageBuffer,
} from '../util/messageBuffer';

type HandleNewMessageOptions = {
  countUnread?: boolean;
};

// Floor on delay-queue checks so a burst of releases coalesces into one drain.
const DELAY_RELEASE_MIN_INTERVAL_MS = 80;

function publishBufferedMessages(messages: BufferedMessage[]) {
  if (messages.length === 0) {
    return;
  }

  startTransition(() => {
    addMessages(messages);
  });
}

function shouldArmBottomContentAnchor(
  isScrollingToBottomRef?: MutableRefObject<boolean>,
) {
  return isScrollingToBottomRef?.current ?? false;
}

interface UseChatMessagesOptions {
  /**
   * Applied to each message as it leaves the buffer for the store, so the
   * live path can defer emote/badge parsing to commit time.
   */
  finalizeMessageForCommit?: (message: BufferedMessage) => BufferedMessage;
  /**
   * Hold live messages this many ms before the render buffer (default 0 = no
   * delay).
   */
  getChatDelayMs?: () => number;
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  isUserActivelyScrolling?: () => boolean;
  onBottomContentChange?: () => void;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const {
    finalizeMessageForCommit,
    getChatDelayMs,
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange,
    onUnreadIncrement,
  } = options;

  const bufferRef = useLazyRef(() => createMessageBuffer());
  const delayQueueRef = useLazyRef(() => createChatDelayQueue());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayTickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushBufferRef = useRef<() => void>(() => {});
  const scheduleDelayTickRef = useRef<() => void>(() => {});
  const getChatDelayMsRef = useRef<() => number>(getChatDelayMs ?? (() => 0));
  const finalizeMessageForCommitRef = useRef(finalizeMessageForCommit);
  const isFlushingRef = useRef(false);
  const pendingUnreadCountRef = useRef(0);
  // Set when a flush sees a raid-sized batch; slows the next live flush cadence.
  const raidFlushModeRef = useRef(false);

  useLayoutEffect(() => {
    getChatDelayMsRef.current = getChatDelayMs ?? (() => 0);
    finalizeMessageForCommitRef.current = finalizeMessageForCommit;
  });

  const flushBuffer = useCallback(() => {
    flushTimerRef.current = null;
    const buffer = bufferRef.current;

    if (buffer.size() === 0) {
      if (pendingUnreadCountRef.current > 0) {
        onUnreadIncrement(pendingUnreadCountRef.current);
        pendingUnreadCountRef.current = 0;
      }
      return;
    }
    if (isFlushingRef.current) {
      return;
    }
    if (!isAtBottomRef.current && isUserActivelyScrolling?.()) {
      flushTimerRef.current = setTimeout(() => {
        flushBufferRef.current();
      }, SCROLL_DEFERRED_FLUSH_RETRY_MS);
      return;
    }

    isFlushingRef.current = true;

    try {
      const drained = buffer.drain();
      raidFlushModeRef.current = shouldEnterRaidFlushMode(
        drained.length,
        isAtBottomRef.current,
      );
      const messagesToFlush = sampleLiveCommit(drained, isAtBottomRef.current);
      const shouldMaintainBottom = shouldArmBottomContentAnchor(
        isScrollingToBottomRef,
      );

      const finalize = finalizeMessageForCommitRef.current;
      publishBufferedMessages(
        finalize ? messagesToFlush.map(finalize) : messagesToFlush,
      );

      if (shouldMaintainBottom) {
        onBottomContentChange?.();
      }

      if (pendingUnreadCountRef.current > 0) {
        onUnreadIncrement(pendingUnreadCountRef.current);
        pendingUnreadCountRef.current = 0;
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [
    bufferRef,
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange,
    onUnreadIncrement,
  ]);

  useLayoutEffect(() => {
    flushBufferRef.current = flushBuffer;
  });

  const startFlushTimer = useCallback((delayMs: number) => {
    if (flushTimerRef.current) {
      return;
    }

    flushTimerRef.current = setTimeout(() => {
      flushBufferRef.current();
    }, delayMs);
  }, []);

  const clearDelayTick = useCallback(() => {
    if (delayTickTimerRef.current) {
      clearTimeout(delayTickTimerRef.current);
      delayTickTimerRef.current = null;
    }
  }, []);

  // Commit one message into the render buffer + run unread/flush bookkeeping (shared by
  // the direct and delayed-release paths).
  const ingestMessage = useCallback(
    (message: BufferedMessage, countUnread?: boolean) => {
      const { added, dropped } = bufferRef.current.add(message);
      if (!added) {
        return;
      }

      if (dropped > 0) {
        pendingUnreadCountRef.current = Math.max(
          0,
          pendingUnreadCountRef.current - dropped,
        );
      }

      const scrollingToBottom = isScrollingToBottomRef?.current ?? false;
      if (
        countUnread !== false &&
        !isAtBottomRef.current &&
        !scrollingToBottom
      ) {
        pendingUnreadCountRef.current += 1;
      }

      const flushDelay = pickFlushDelay({
        isAtBottom: isAtBottomRef.current,
        raidMode: raidFlushModeRef.current,
        scrollingToBottom,
      });
      startFlushTimer(flushDelay);
    },
    [bufferRef, isAtBottomRef, isScrollingToBottomRef, startFlushTimer],
  );

  const runDelayTick = useCallback(() => {
    delayTickTimerRef.current = null;
    const due = delayQueueRef.current.drainDue(Date.now());
    due.forEach(entry => ingestMessage(entry.message, entry.countUnread));
    scheduleDelayTickRef.current();
  }, [delayQueueRef, ingestMessage]);

  const scheduleDelayTick = useCallback(() => {
    if (delayTickTimerRef.current) {
      return;
    }
    const nextReleaseAt = delayQueueRef.current.peekNextReleaseAt();
    if (nextReleaseAt == null) {
      return;
    }
    const wait = Math.max(
      DELAY_RELEASE_MIN_INTERVAL_MS,
      nextReleaseAt - Date.now(),
    );
    delayTickTimerRef.current = setTimeout(runDelayTick, wait);
  }, [delayQueueRef, runDelayTick]);

  useLayoutEffect(() => {
    scheduleDelayTickRef.current = scheduleDelayTick;
  });

  const handleNewMessage = useCallback(
    (newMessage: BufferedMessage, messageOptions?: HandleNewMessageOptions) => {
      const messageWithCachedColor = {
        ...newMessage,
        cachedSenderColor: resolveCachedSenderColor(
          newMessage,
          getUserMessageColor,
        ),
      };

      const countUnread = messageOptions?.countUnread;
      // Historical replay (countUnread === false) is already old, so it bypasses the delay.
      const rawDelayMs =
        countUnread === false ? 0 : getChatDelayMsRef.current();
      const delayMs =
        Number.isFinite(rawDelayMs) && rawDelayMs > 0 ? rawDelayMs : 0;

      if (delayMs <= 0) {
        ingestMessage(messageWithCachedColor, countUnread);
        return;
      }

      delayQueueRef.current.enqueue(
        messageWithCachedColor,
        Date.now() + delayMs,
        countUnread !== false,
      );
      scheduleDelayTick();
    },
    [delayQueueRef, ingestMessage, scheduleDelayTick],
  );

  // On delay-setting change: drain everything held if delay is off, else ensure a tick is pending.
  const reconcileChatDelay = useCallback(() => {
    const effectiveDelayMs = getChatDelayMsRef.current();
    if (!Number.isFinite(effectiveDelayMs) || effectiveDelayMs <= 0) {
      clearDelayTick();
      delayQueueRef.current
        .drainAll()
        .forEach(entry => ingestMessage(entry.message, entry.countUnread));
      return;
    }
    scheduleDelayTick();
  }, [clearDelayTick, delayQueueRef, ingestMessage, scheduleDelayTick]);

  const forceFlush = useCallback(() => {
    const buffer = bufferRef.current;
    if (buffer.size() === 0) {
      return;
    }

    const bufferedMessages = buffer.drain();
    const shouldMaintainBottom = shouldArmBottomContentAnchor(
      isScrollingToBottomRef,
    );

    const finalize = finalizeMessageForCommitRef.current;
    publishBufferedMessages(
      finalize ? bufferedMessages.map(finalize) : bufferedMessages,
    );

    if (shouldMaintainBottom) {
      onBottomContentChange?.();
    }

    if (pendingUnreadCountRef.current > 0) {
      onUnreadIncrement(pendingUnreadCountRef.current);
      pendingUnreadCountRef.current = 0;
    }
  }, [
    bufferRef,
    isScrollingToBottomRef,
    onBottomContentChange,
    onUnreadIncrement,
  ]);

  const clearLocalMessages = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    bufferRef.current.clear();
    delayQueueRef.current.clear();
    clearDelayTick();
    pendingUnreadCountRef.current = 0;
    raidFlushModeRef.current = false;
  }, [bufferRef, clearDelayTick, delayQueueRef]);

  const removeBufferedMessageById = useCallback(
    (messageId: string) => {
      bufferRef.current.removeById(messageId);
      delayQueueRef.current.removeById(messageId);
    },
    [bufferRef, delayQueueRef],
  );

  const removeBufferedMessagesByLogin = useCallback(
    (login: string) => {
      bufferRef.current.removeByLogin(login);
      delayQueueRef.current.removeByLogin(login);
    },
    [bufferRef, delayQueueRef],
  );

  const moderateBufferedMessageById = useCallback(
    (messageId: string, moderationNotice: string) => {
      bufferRef.current.moderateById(messageId, moderationNotice);
      delayQueueRef.current.moderateById(messageId, moderationNotice);
    },
    [bufferRef, delayQueueRef],
  );

  const moderateBufferedMessagesByLogin = useCallback(
    (login: string, moderationNotice: string) => {
      bufferRef.current.moderateByLogin(login, moderationNotice);
      delayQueueRef.current.moderateByLogin(login, moderationNotice);
    },
    [bufferRef, delayQueueRef],
  );

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    clearDelayTick();
    bufferRef.current.clear();
    delayQueueRef.current.clear();
    pendingUnreadCountRef.current = 0;
    raidFlushModeRef.current = false;
  }, [bufferRef, clearDelayTick, delayQueueRef]);

  const getBufferSize = useCallback(
    () => bufferRef.current.size(),
    [bufferRef],
  );

  return {
    handleNewMessage,
    clearLocalMessages,
    reconcileChatDelay,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize,
  };
};
