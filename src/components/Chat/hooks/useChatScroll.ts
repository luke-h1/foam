import { FlashListRef } from '@shopify/flash-list';
import { RefObject, useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Threshold in pixels from the bottom to consider user "at bottom"
 */
const BOTTOM_THRESHOLD = 50;

/**
 * Grace period (ms) after being at bottom where we still auto-scroll.
 * Covers transient scroll events from message trimming.
 */
const BOTTOM_GRACE_MS = 300;

interface UseChatScrollOptions<T> {
  flashListRef: RefObject<FlashListRef<T> | null>;
}

export const useChatScroll = <T>({ flashListRef }: UseChatScrollOptions<T>) => {
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false);
  const isScrollingToBottomRef = useRef(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAtBottomTimeRef = useRef(Date.now());

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      isAtBottomRef.current = atBottom;

      if (atBottom) {
        lastAtBottomTimeRef.current = Date.now();
      }

      if (!isScrollingToBottomRef.current || atBottom) {
        setIsAtBottom(atBottom);

        if (isScrollingToBottomRef.current && atBottom) {
          isScrollingToBottomRef.current = false;
          setIsScrollingToBottom(false);
        }
      }

      if (atBottom) {
        setUnreadCount(0);
      }
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    isScrollingToBottomRef.current = true;
    setIsScrollingToBottom(true);

    flashListRef.current?.scrollToEnd({ animated: true });

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
    }, 300);
  }, [flashListRef]);

  const handleContentSizeChange = useCallback(() => {
    if (isScrollingToBottomRef.current) {
      return;
    }

    const wasRecentlyAtBottom =
      Date.now() - lastAtBottomTimeRef.current < BOTTOM_GRACE_MS;

    if (!isAtBottomRef.current && !wasRecentlyAtBottom) {
      return;
    }

    isAtBottomRef.current = true;
    lastAtBottomTimeRef.current = Date.now();
    flashListRef.current?.scrollToEnd({ animated: false });
  }, [flashListRef]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
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
