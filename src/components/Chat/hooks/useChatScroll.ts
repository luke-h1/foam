import { FlashListRef } from '@shopify/flash-list';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Threshold in pixels from the bottom to consider user "at bottom"
 */
const BOTTOM_THRESHOLD = 50;

interface UseChatScrollOptions<T> {
  flashListRef: RefObject<FlashListRef<T> | null>;
  messagesLength: number;
}

export const useChatScroll = <T>({
  flashListRef,
  messagesLength,
}: UseChatScrollOptions<T>) => {
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLengthRef = useRef(messagesLength);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const messagesLengthRef = useRef(messagesLength);

  useEffect(() => {
    messagesLengthRef.current = messagesLength;
  }, [messagesLength]);

  useEffect(() => {
    const newMessageCount = messagesLength - prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messagesLength;

    // Only increment unread if user has scrolled away from bottom
    if (newMessageCount > 0 && !isAtBottomRef.current) {
      setUnreadCount(prev => prev + newMessageCount);
    }
  }, [messagesLength]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      // At bottom when scrolled near the end of content
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      isAtBottomRef.current = atBottom;

      if (!isScrollingToBottom || atBottom) {
        setIsAtBottom(atBottom);

        if (isScrollingToBottom && atBottom) {
          setIsScrollingToBottom(false);
        }
      }

      if (atBottom) {
        setUnreadCount(0);
      }
    },
    [isScrollingToBottom],
  );

  const scrollToBottom = useCallback(() => {
    const currentLength = messagesLengthRef.current;
    if (currentLength === 0) {
      return;
    }

    setIsScrollingToBottom(true);

    void flashListRef.current?.scrollToIndex({
      index: currentLength - 1,
      animated: true,
    });

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      setIsScrollingToBottom(false);
    }, 150);
  }, [flashListRef]);

  const handleContentSizeChange = useCallback(() => {
    // Don't auto-scroll if user has scrolled away or if we're already scrolling
    if (!isAtBottomRef.current || isScrollingToBottom) {
      return;
    }

    // Clear any existing timeout
    if (contentSizeTimeoutRef.current) {
      clearTimeout(contentSizeTimeoutRef.current);
    }

    contentSizeTimeoutRef.current = setTimeout(() => {
      const currentLength = messagesLengthRef.current;
      if (currentLength === 0) {
        return;
      }

      void flashListRef.current?.scrollToIndex({
        index: currentLength - 1,
        animated: false,
      });
    }, 10);
  }, [flashListRef, isScrollingToBottom]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    if (contentSizeTimeoutRef.current) {
      clearTimeout(contentSizeTimeoutRef.current);
    }
  }, []);

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
    incrementUnread,
    cleanup,
  };
};
