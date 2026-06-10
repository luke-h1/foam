import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import {
  addMessages,
  getMaxChatMessages,
  getUserMessageColor,
} from '@app/store/chat/actions/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import { useLazyRef } from '@app/hooks/useLazyRef';
import {
  MutableRefObject,
  startTransition,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

// Each flush commits a new Fabric shadow tree for the chat list, and at high
// message rates releasing the dead trees dominated the Hermes GC thread
// (issue #594). 100ms still reads as live (10 updates/s) and cut app CPU by
// ~40% on an 18k-viewer chat; at moderate rates it measures neutral.
const LIVE_BUFFER_FLUSH_INTERVAL_MS = 100;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 250;
// While a drag or fling is in progress away from the bottom, publishing a
// flush re-keys rows and forces maintainVisibleContentPosition adjustments
// mid-gesture, dropping frames. Hold the buffer and retry once the gesture
// settles; the buffer cap equals the store cap so nothing extra is lost.
const SCROLL_DEFERRED_FLUSH_RETRY_MS = 250;
// The buffer cap tracks the store cap so a held flush can still replace the
// whole scrollback without dropping messages the store would have kept.
const getMaxBufferedMessages = () => getMaxChatMessages();

type AnyMessage = AnyChatMessageType & {
  cachedSenderColor?: string;
};

type HandleNewMessageOptions = {
  countUnread?: boolean;
};

function getBufferedMessageKey(message: AnyMessage): string {
  const id = message.id?.trim();
  if (id) {
    return id;
  }

  return `${normaliseMessageId(message.message_id)}_${normaliseMessageId(
    message.message_nonce,
  )}`;
}

function normaliseMessageId(value: string): string {
  return value.trim();
}

function normaliseLogin(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function createModeratedBufferMessage(
  message: AnyMessage,
  moderationNotice: string,
): AnyMessage {
  const plainText = replaceEmotesWithText(message.message).trim();

  return {
    ...message,
    message: [
      {
        type: 'text',
        content: plainText
          ? `${plainText}\u2014${moderationNotice}`
          : moderationNotice,
      },
    ],
    moderationNotice,
  };
}

function publishBufferedMessages(messages: AnyMessage[]) {
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

  const messageBufferRef = useRef<AnyMessage[]>([]);
  const messageBufferIndexRef = useLazyRef(() => new Map<string, number>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushBufferRef = useRef<() => void>(() => {});
  const isFlushingRef = useRef(false);
  const pendingUnreadCountRef = useRef(0);

  const resetBuffer = useCallback(() => {
    messageBufferRef.current = [];
    messageBufferIndexRef.current.clear();
  }, [messageBufferIndexRef]);

  const rebuildBufferIndex = useCallback(
    (messages: AnyMessage[]) => {
      messageBufferIndexRef.current.clear();
      messages.forEach((message, index) => {
        messageBufferIndexRef.current.set(
          getBufferedMessageKey(message),
          index,
        );
      });
    },
    [messageBufferIndexRef],
  );

  const flushBuffer = useCallback(() => {
    flushTimerRef.current = null;

    if (messageBufferRef.current.length === 0) {
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

    const messagesToFlush = messageBufferRef.current;
    resetBuffer();
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

    isFlushingRef.current = false;
  }, [
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange,
    onUnreadIncrement,
    resetBuffer,
  ]);

  useLayoutEffect(() => {
    flushBufferRef.current = flushBuffer;
  });

  const startFlushTimer = (delayMs: number) => {
    if (flushTimerRef.current) {
      return;
    }

    flushTimerRef.current = setTimeout(() => {
      flushBuffer();
    }, delayMs);
  };

  const enqueueMessage = (
    newMessage: AnyMessage,
    options?: HandleNewMessageOptions,
  ) => {
    const key = getBufferedMessageKey(newMessage);

    const messageWithCachedColor = {
      ...newMessage,
      cachedSenderColor: resolveCachedSenderColor(
        newMessage,
        getUserMessageColor,
      ),
    };

    const existingIndex = messageBufferIndexRef.current.get(key);

    if (typeof existingIndex === 'number') {
      const existingMsg = messageBufferRef.current[existingIndex];
      messageBufferRef.current[existingIndex] = {
        ...messageWithCachedColor,
        cachedSenderColor:
          existingMsg?.cachedSenderColor ??
          messageWithCachedColor.cachedSenderColor,
      };
      return;
    }

    messageBufferIndexRef.current.set(key, messageBufferRef.current.length);
    messageBufferRef.current.push(messageWithCachedColor);
    const maxBufferedMessages = getMaxBufferedMessages();
    if (messageBufferRef.current.length > maxBufferedMessages) {
      const droppedCount =
        messageBufferRef.current.length - maxBufferedMessages;
      messageBufferRef.current =
        messageBufferRef.current.slice(-maxBufferedMessages);
      rebuildBufferIndex(messageBufferRef.current);
      pendingUnreadCountRef.current = Math.max(
        0,
        pendingUnreadCountRef.current - droppedCount,
      );
    }

    const scrollingToBottom = isScrollingToBottomRef?.current ?? false;
    if (
      options?.countUnread !== false &&
      !isAtBottomRef.current &&
      !scrollingToBottom
    ) {
      pendingUnreadCountRef.current += 1;
    }

    const flushDelay =
      isAtBottomRef.current || scrollingToBottom
        ? LIVE_BUFFER_FLUSH_INTERVAL_MS
        : BACKLOG_BUFFER_FLUSH_INTERVAL_MS;
    startFlushTimer(flushDelay);
  };

  const handleNewMessage = (
    newMessage: AnyMessage,
    options?: HandleNewMessageOptions,
  ) => {
    enqueueMessage(newMessage, options);
  };

  const forceFlush = useCallback(() => {
    if (messageBufferRef.current.length === 0) {
      return;
    }

    const bufferedMessages = messageBufferRef.current;
    resetBuffer();
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
    isScrollingToBottomRef,
    onBottomContentChange,
    onUnreadIncrement,
    resetBuffer,
  ]);

  const clearLocalMessages = useCallback(() => {
    resetBuffer();
    pendingUnreadCountRef.current = 0;
  }, [resetBuffer]);

  const removeBufferedMessageById = (messageId: string) => {
    const normalisedMessageId = messageId.trim();
    if (!normalisedMessageId) {
      return;
    }

    const nextBuffer = messageBufferRef.current.filter(
      message =>
        message.message_id.trim() !== normalisedMessageId &&
        message.id?.trim() !== normalisedMessageId,
    );
    if (nextBuffer.length === messageBufferRef.current.length) {
      return;
    }
    messageBufferRef.current = nextBuffer;
    rebuildBufferIndex(nextBuffer);
  };

  const removeBufferedMessagesByLogin = (login: string) => {
    const target = normaliseLogin(login);
    if (!target) {
      return;
    }

    const nextBuffer = messageBufferRef.current.filter(
      message =>
        normaliseLogin(
          message.userstate?.login ||
            message.userstate?.username ||
            message.sender,
        ) !== target,
    );
    if (nextBuffer.length === messageBufferRef.current.length) {
      return;
    }
    messageBufferRef.current = nextBuffer;
    rebuildBufferIndex(nextBuffer);
  };

  const moderateBufferedMessageById = (
    messageId: string,
    moderationNotice: string,
  ) => {
    const normalisedMessageId = normaliseMessageId(messageId);
    if (!normalisedMessageId) {
      return;
    }

    let nextBuffer: AnyMessage[] | null = null;

    messageBufferRef.current.forEach((message, index) => {
      if (message.message_id !== normalisedMessageId) {
        return;
      }

      nextBuffer ??= messageBufferRef.current.slice();
      nextBuffer[index] = createModeratedBufferMessage(
        message,
        moderationNotice,
      );
    });

    if (nextBuffer) {
      messageBufferRef.current = nextBuffer;
    }
  };

  const moderateBufferedMessagesByLogin = (
    login: string,
    moderationNotice: string,
  ) => {
    const target = normaliseLogin(login);
    if (!target) {
      return;
    }

    let nextBuffer: AnyMessage[] | null = null;

    messageBufferRef.current.forEach((message, index) => {
      const messageLogin = normaliseLogin(
        message.userstate?.login ||
          message.userstate?.username ||
          message.sender,
      );

      if (messageLogin !== target) {
        return;
      }

      nextBuffer ??= messageBufferRef.current.slice();
      nextBuffer[index] = createModeratedBufferMessage(
        message,
        moderationNotice,
      );
    });

    if (nextBuffer) {
      messageBufferRef.current = nextBuffer;
    }
  };

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    resetBuffer();
    pendingUnreadCountRef.current = 0;
  }, [resetBuffer]);

  return {
    handleNewMessage,
    clearLocalMessages,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize: () => messageBufferRef.current.length,
  };
};
