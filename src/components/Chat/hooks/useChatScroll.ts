import { FlashListRef } from '@shopify/flash-list';
import { RefObject, useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

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
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Track messages length in ref for immediate access
  const messagesLengthRef = useRef(messagesLength);
  messagesLengthRef.current = messagesLength;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

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

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current && !isScrollingToBottom) {
      const lastIndex = messagesLengthRef.current - 1;
      if (lastIndex >= 0) {
        setTimeout(() => {
          if (isAtBottomRef.current && !isScrollingToBottom) {
            void flashListRef.current?.scrollToIndex({
              index: messagesLengthRef.current - 1,
              animated: false,
            });
          }
        }, 0);
      }
    }
  }, [isScrollingToBottom, flashListRef]);

  const scrollToBottom = useCallback(() => {
    setIsScrollingToBottom(true);
    const lastIndex = messagesLengthRef.current - 1;

    if (lastIndex >= 0) {
      void flashListRef.current?.scrollToIndex({
        index: lastIndex,
        animated: true,
      });
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      setIsScrollingToBottom(false);
      scrollTimeoutRef.current = null;
    }, 100);
  }, [flashListRef]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
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
