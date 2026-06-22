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
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  isUserActivelyScrolling?: () => boolean;
  onBottomContentChange?: () => void;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const {
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange,
    onUnreadIncrement,
  } = options;

  const bufferRef = useLazyRef(() => createMessageBuffer());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushBufferRef = useRef<() => void>(() => {});
  const isFlushingRef = useRef(false);
  const pendingUnreadCountRef = useRef(0);
  // Set when a flush sees a raid-sized batch; slows the next live flush cadence.
  const raidFlushModeRef = useRef(false);

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

      publishBufferedMessages(messagesToFlush);

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

  const handleNewMessage = useCallback(
    (newMessage: BufferedMessage, messageOptions?: HandleNewMessageOptions) => {
      const messageWithCachedColor = {
        ...newMessage,
        cachedSenderColor: resolveCachedSenderColor(
          newMessage,
          getUserMessageColor,
        ),
      };

      const { added, dropped } = bufferRef.current.add(messageWithCachedColor);

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
        messageOptions?.countUnread !== false &&
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

  const forceFlush = useCallback(() => {
    const buffer = bufferRef.current;
    if (buffer.size() === 0) {
      return;
    }

    const bufferedMessages = buffer.drain();
    const shouldMaintainBottom = shouldArmBottomContentAnchor(
      isScrollingToBottomRef,
    );

    publishBufferedMessages(bufferedMessages);

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
    bufferRef.current.clear();
    pendingUnreadCountRef.current = 0;
  }, [bufferRef]);

  const removeBufferedMessageById = useCallback(
    (messageId: string) => {
      bufferRef.current.removeById(messageId);
    },
    [bufferRef],
  );

  const removeBufferedMessagesByLogin = useCallback(
    (login: string) => {
      bufferRef.current.removeByLogin(login);
    },
    [bufferRef],
  );

  const moderateBufferedMessageById = useCallback(
    (messageId: string, moderationNotice: string) => {
      bufferRef.current.moderateById(messageId, moderationNotice);
    },
    [bufferRef],
  );

  const moderateBufferedMessagesByLogin = useCallback(
    (login: string, moderationNotice: string) => {
      bufferRef.current.moderateByLogin(login, moderationNotice);
    },
    [bufferRef],
  );

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    bufferRef.current.clear();
    pendingUnreadCountRef.current = 0;
    raidFlushModeRef.current = false;
  }, [bufferRef]);

  const getBufferSize = useCallback(
    () => bufferRef.current.size(),
    [bufferRef],
  );

  return {
    handleNewMessage,
    clearLocalMessages,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize,
  };
};
