import { addMessages, ChatMessageType } from '@app/store/chatStore';
import { MutableRefObject, useCallback, useRef } from 'react';

const BATCH_SIZE = 3;
const BATCH_TIMEOUT_MS = 10;
const MAX_MESSAGES = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = ChatMessageType<any, any>;

interface UseChatMessagesOptions {
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottom: boolean;
  onUnreadIncrement: (count: number) => void;
  onAutoScroll: () => void;
}

export const useChatMessages = (options: UseChatMessagesOptions) => {
  const {
    isAtBottomRef,
    isScrollingToBottom,
    onUnreadIncrement,
    onAutoScroll,
  } = options;

  const messagesRef = useRef<AnyMessage[]>([]);
  const messageBatchRef = useRef<AnyMessage[]>([]);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processMessageBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0) return;

    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];

    // Deduplicate within batch by message_id + message_nonce
    const deduplicatedBatch = batch.reduce((acc, message) => {
      const key = `${message.message_id}_${message.message_nonce}`;
      const existingIndex = acc.findIndex(
        m => `${m.message_id}_${m.message_nonce}` === key,
      );

      if (existingIndex >= 0) {
        acc[existingIndex] = message;
      } else {
        acc.push(message);
      }
      return acc;
    }, [] as AnyMessage[]);

    addMessages(deduplicatedBatch as ChatMessageType<never>[]);

    messagesRef.current = [...messagesRef.current, ...deduplicatedBatch].slice(
      -MAX_MESSAGES,
    );

    // Handle unread count when not at bottom
    if (!isAtBottomRef.current) {
      onUnreadIncrement(deduplicatedBatch.length);
    }

    // Trigger auto-scroll when at bottom and not already scrolling
    if (isAtBottomRef.current && !isScrollingToBottom) {
      setTimeout(() => {
        onAutoScroll();
      }, 0);
    }
  }, [isAtBottomRef, isScrollingToBottom, onUnreadIncrement, onAutoScroll]);

  const handleNewMessage = useCallback(
    (newMessage: AnyMessage) => {
      messageBatchRef.current.push(newMessage);

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      if (messageBatchRef.current.length >= BATCH_SIZE) {
        processMessageBatch();
      } else {
        batchTimeoutRef.current = setTimeout(() => {
          processMessageBatch();
        }, BATCH_TIMEOUT_MS);
      }
    },
    [processMessageBatch],
  );

  const clearLocalMessages = useCallback(() => {
    messagesRef.current = [];
    messageBatchRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  return {
    messagesRef,
    handleNewMessage,
    clearLocalMessages,
    cleanup,
  };
};
