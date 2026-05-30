import type { ChatMessageType } from '@app/store/chatStore/constants';
import { addMessages } from '@app/store/chatStore/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { lightenColor } from '@app/utils/color/lightenColor';
import { MutableRefObject, startTransition, useCallback, useRef } from 'react';

const LIVE_BUFFER_FLUSH_INTERVAL_MS = 32;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 80;
const MAX_BUFFERED_MESSAGES = 600;

const colorCache = new Map<string, string>();
const MAX_COLOR_CACHE_SIZE = 200;

function getCachedLightenedColor(color?: string): string | undefined {
  if (!color) {
    return undefined;
  }

  const cached = colorCache.get(color);
  if (cached) {
    return cached;
  }

  const lightened = lightenColor(color);
  colorCache.set(color, lightened);

  if (colorCache.size > MAX_COLOR_CACHE_SIZE) {
    const firstKey = colorCache.keys().next().value as string | undefined;
    if (firstKey) {
      colorCache.delete(firstKey);
    }
  }

  return lightened;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = ChatMessageType<any, any> & {
  cachedSenderColor?: string;
};

type HandleNewMessageOptions = {
  countUnread?: boolean;
};

function getBufferedMessageKey(message: AnyMessage): string {
  return `${message.message_id}_${message.message_nonce}`;
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
    addMessages(messages as ChatMessageType<never>[]);
  });
}

interface UseChatMessagesOptions {
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const { isAtBottomRef, isScrollingToBottomRef, onUnreadIncrement } = options;

  const messageBufferRef = useRef<AnyMessage[]>([]);
  const messageBufferIndexRef = useRef<Map<string, number>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);
  const pendingUnreadCountRef = useRef(0);

  const resetBuffer = useCallback(() => {
    messageBufferRef.current = [];
    messageBufferIndexRef.current.clear();
  }, []);

  const rebuildBufferIndex = useCallback((messages: AnyMessage[]) => {
    messageBufferIndexRef.current.clear();
    messages.forEach((message, index) => {
      messageBufferIndexRef.current.set(getBufferedMessageKey(message), index);
    });
  }, []);

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

    isFlushingRef.current = true;

    const messagesToFlush = messageBufferRef.current;
    resetBuffer();

    publishBufferedMessages(messagesToFlush);

    if (pendingUnreadCountRef.current > 0) {
      onUnreadIncrement(pendingUnreadCountRef.current);
      pendingUnreadCountRef.current = 0;
    }

    isFlushingRef.current = false;
  }, [onUnreadIncrement, resetBuffer]);

  const startFlushTimer = useCallback(
    (delayMs: number) => {
      if (flushTimerRef.current) {
        return;
      }

      flushTimerRef.current = setTimeout(() => {
        flushBuffer();
      }, delayMs);
    },
    [flushBuffer],
  );

  const enqueueMessage = useCallback(
    (newMessage: AnyMessage, options?: HandleNewMessageOptions) => {
      const key = getBufferedMessageKey(newMessage);

      const messageWithCachedColor = {
        ...newMessage,
        cachedSenderColor: getCachedLightenedColor(newMessage.userstate?.color),
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
      if (messageBufferRef.current.length > MAX_BUFFERED_MESSAGES) {
        const droppedCount =
          messageBufferRef.current.length - MAX_BUFFERED_MESSAGES;
        messageBufferRef.current = messageBufferRef.current.slice(
          -MAX_BUFFERED_MESSAGES,
        );
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
    },
    [
      isAtBottomRef,
      isScrollingToBottomRef,
      rebuildBufferIndex,
      startFlushTimer,
    ],
  );

  const handleNewMessage = useCallback(
    (newMessage: AnyMessage, options?: HandleNewMessageOptions) => {
      enqueueMessage(newMessage, options);
    },
    [enqueueMessage],
  );

  const forceFlush = useCallback(() => {
    if (messageBufferRef.current.length === 0) {
      return;
    }

    const bufferedMessages = messageBufferRef.current;
    resetBuffer();

    publishBufferedMessages(bufferedMessages);

    if (pendingUnreadCountRef.current > 0) {
      onUnreadIncrement(pendingUnreadCountRef.current);
      pendingUnreadCountRef.current = 0;
    }
  }, [onUnreadIncrement, resetBuffer]);

  const clearLocalMessages = useCallback(() => {
    resetBuffer();
    pendingUnreadCountRef.current = 0;
  }, [resetBuffer]);

  const removeBufferedMessageById = useCallback(
    (messageId: string) => {
      if (!messageId.trim()) {
        return;
      }

      const nextBuffer = messageBufferRef.current.filter(
        message => message.message_id !== messageId,
      );
      if (nextBuffer.length === messageBufferRef.current.length) {
        return;
      }
      messageBufferRef.current = nextBuffer;
      rebuildBufferIndex(nextBuffer);
    },
    [rebuildBufferIndex],
  );

  const moderateBufferedMessageById = useCallback(
    (messageId: string, moderationNotice: string) => {
      if (!messageId.trim()) {
        return;
      }

      let nextBuffer: AnyMessage[] | null = null;

      messageBufferRef.current.forEach((message, index) => {
        if (message.message_id !== messageId) {
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
    },
    [],
  );

  const moderateBufferedMessagesByLogin = useCallback(
    (login: string, moderationNotice: string) => {
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
    },
    [],
  );

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
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize: () => messageBufferRef.current.length,
  };
};
