import { FlashListRef } from '@shopify/flash-list';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Threshold in pixels from the bottom to consider user "at bottom"
 */
const BOTTOM_THRESHOLD = 100;

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

  // Track new messages for unread count
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
    setIsScrollingToBottom(true);

    // Scroll to the end of the list to see newest messages
    void flashListRef.current?.scrollToEnd({
      animated: true,
    });

    setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      setIsScrollingToBottom(false);
    }, 300);
  }, [flashListRef]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {}, []);

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    unreadCount,
    setUnreadCount,
    handleScroll,
    scrollToBottom,
    incrementUnread,
    cleanup,
  };
};
