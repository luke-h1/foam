import { addMessages, ChatMessageType } from '@app/store/chatStore';
import { lightenColor } from '@app/utils/color/lightenColor';
import { MutableRefObject, useCallback, useRef } from 'react';

const BUFFER_FLUSH_INTERVAL_MS = 50;

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

interface UseChatMessagesOptions {
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  onUnreadIncrement: (count: number) => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const { isAtBottomRef, isScrollingToBottomRef, onUnreadIncrement } = options;

  const messageBufferRef = useRef<AnyMessage[]>([]);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFlushingRef = useRef(false);

  const flushBuffer = useCallback(() => {
    if (messageBufferRef.current.length === 0) return;
    if (isFlushingRef.current) return;

    isFlushingRef.current = true;

    const messagesToFlush = messageBufferRef.current;
    messageBufferRef.current = [];

    if (messagesToFlush.length > 0) {
      addMessages(messagesToFlush as ChatMessageType<never>[]);
    }

    isFlushingRef.current = false;
  }, []);

  const startFlushTimer = useCallback(() => {
    if (flushTimerRef.current) return;

    flushTimerRef.current = setInterval(() => {
      flushBuffer();
    }, BUFFER_FLUSH_INTERVAL_MS);
  }, [flushBuffer]);

  const handleNewMessage = useCallback(
    (newMessage: AnyMessage) => {
      const key = `${newMessage.message_id}_${newMessage.message_nonce}`;

      const messageWithCachedColor = {
        ...newMessage,
        cachedSenderColor: getCachedLightenedColor(newMessage.userstate?.color),
      };

      const existingIndex = messageBufferRef.current.findIndex(
        msg => `${msg.message_id}_${msg.message_nonce}` === key,
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

      seenKeysRef.current.add(key);

      messageBufferRef.current.push(messageWithCachedColor);

      const scrollingToBottom = isScrollingToBottomRef?.current ?? false;
      if (!isAtBottomRef.current && !scrollingToBottom) {
        onUnreadIncrement(1);
      }

      startFlushTimer();
    },
    [isAtBottomRef, isScrollingToBottomRef, onUnreadIncrement, startFlushTimer],
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
  }, []);

  const clearLocalMessages = useCallback(() => {
    messageBufferRef.current = [];
    seenKeysRef.current.clear();
  }, []);

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    messageBufferRef.current = [];
  }, []);

  return {
    handleNewMessage,
    clearLocalMessages,
    cleanup,
    forceFlush,
    getBufferSize: () => messageBufferRef.current.length,
  };
};
