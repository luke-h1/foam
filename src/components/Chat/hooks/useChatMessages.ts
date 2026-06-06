import type { AnyChatMessageType } from '@app/store/chatStore/constants';
import { addMessages } from '@app/store/chatStore/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { MutableRefObject, startTransition, useRef, useCallback } from 'react';

const LIVE_BUFFER_FLUSH_INTERVAL_MS = 32;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 80;
const MAX_BUFFERED_MESSAGES = 600;

type AnyMessage = AnyChatMessageType & {
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
  onBottomContentChange?: () => void;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const {
    isAtBottomRef,
    isScrollingToBottomRef,
    onBottomContentChange,
    onUnreadIncrement,
  } = options;

  const messageBufferRef = useRef<AnyMessage[]>([]);
  const messageBufferIndexRef = useLazyRef(() => new Map<string, number>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    isScrollingToBottomRef,
    onBottomContentChange,
    onUnreadIncrement,
    resetBuffer,
  ]);

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
      cachedSenderColor: resolveCachedSenderColor(newMessage),
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
  };

  const moderateBufferedMessageById = (
    messageId: string,
    moderationNotice: string,
  ) => {
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
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    cleanup,
    forceFlush,
    getBufferSize: () => messageBufferRef.current.length,
  };
};
