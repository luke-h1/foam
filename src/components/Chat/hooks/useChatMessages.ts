import type { ChatMessageType } from '@app/store/chatStore/constants';
import { addMessages } from '@app/store/chatStore/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { lightenColor } from '@app/utils/color/lightenColor';
import { MutableRefObject, useCallback, useRef } from 'react';

const LIVE_BUFFER_FLUSH_INTERVAL_MS = 16;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 50;
const MAX_BUFFERED_MESSAGES = 600;

const colorCache = new Map<string, string>();
const MAX_COLOR_CACHE_SIZE = 200;

function getCachedLightenedColor(
  color: string | undefined,
): string | undefined {
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

function normaliseLogin(value: string | undefined): string {
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

interface UseChatMessagesOptions {
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const { isAtBottomRef, isScrollingToBottomRef, onUnreadIncrement } = options;

  const messageBufferRef = useRef<AnyMessage[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);
  const pendingUnreadCountRef = useRef(0);

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
    messageBufferRef.current = [];

    if (messagesToFlush.length > 0) {
      addMessages(messagesToFlush as ChatMessageType<never>[]);
    }

    if (pendingUnreadCountRef.current > 0) {
      onUnreadIncrement(pendingUnreadCountRef.current);
      pendingUnreadCountRef.current = 0;
    }

    isFlushingRef.current = false;
  }, [onUnreadIncrement]);

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

      const existingIndex = messageBufferRef.current.findIndex(
        msg => getBufferedMessageKey(msg) === key,
      );

      if (existingIndex >= 0) {
        const existingMsg = messageBufferRef.current[existingIndex];
        messageBufferRef.current[existingIndex] = {
          ...messageWithCachedColor,
          cachedSenderColor:
            existingMsg?.cachedSenderColor ??
            messageWithCachedColor.cachedSenderColor,
        };
        return;
      }

      messageBufferRef.current.push(messageWithCachedColor);
      if (messageBufferRef.current.length > MAX_BUFFERED_MESSAGES) {
        const droppedCount =
          messageBufferRef.current.length - MAX_BUFFERED_MESSAGES;
        messageBufferRef.current = messageBufferRef.current.slice(
          -MAX_BUFFERED_MESSAGES,
        );
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
    [isAtBottomRef, isScrollingToBottomRef, startFlushTimer],
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
    messageBufferRef.current = [];

    if (bufferedMessages.length > 0) {
      addMessages(bufferedMessages as ChatMessageType<never>[]);
    }

    if (pendingUnreadCountRef.current > 0) {
      onUnreadIncrement(pendingUnreadCountRef.current);
      pendingUnreadCountRef.current = 0;
    }
  }, [onUnreadIncrement]);

  const clearLocalMessages = useCallback(() => {
    messageBufferRef.current = [];
    pendingUnreadCountRef.current = 0;
  }, []);

  const removeBufferedMessageById = useCallback((messageId: string) => {
    if (!messageId.trim()) {
      return;
    }

    messageBufferRef.current = messageBufferRef.current.filter(
      message => message.message_id !== messageId,
    );
  }, []);

  const moderateBufferedMessageById = useCallback(
    (messageId: string, moderationNotice: string) => {
      if (!messageId.trim()) {
        return;
      }

      messageBufferRef.current = messageBufferRef.current.map(message =>
        message.message_id === messageId
          ? createModeratedBufferMessage(message, moderationNotice)
          : message,
      );
    },
    [],
  );

  const moderateBufferedMessagesByLogin = useCallback(
    (login: string, moderationNotice: string) => {
      const target = normaliseLogin(login);
      if (!target) {
        return;
      }

      messageBufferRef.current = messageBufferRef.current.map(message => {
        const messageLogin = normaliseLogin(
          message.userstate?.login ||
            message.userstate?.username ||
            message.sender,
        );

        return messageLogin === target
          ? createModeratedBufferMessage(message, moderationNotice)
          : message;
      });
    },
    [],
  );

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    messageBufferRef.current = [];
    pendingUnreadCountRef.current = 0;
  }, []);

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
