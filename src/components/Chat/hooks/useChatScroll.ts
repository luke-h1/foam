import { FlashListRef } from '@app/components/FlashList/FlashList';
import { RefObject, useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';

const BOTTOM_THRESHOLD = 200;
const NOT_AT_BOTTOM_THRESHOLD = 250;
const SCROLL_THROTTLE_MS = 150;

interface UseChatScrollOptions {
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  getMessagesLength: () => number;
}

export const useChatScroll = ({
  listRef,
  getMessagesLength,
}: UseChatScrollOptions) => {
  const isAtBottomRef = useRef(true);
  const isScrollingToBottomRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAtBottomRef = useRef<boolean | null>(null);
  const lastContentHeightRef = useRef(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const { y } = contentOffset;
      const contentHeight = contentSize?.height ?? 0;
      const viewHeight = layoutMeasurement?.height ?? 0;
      const distanceFromEnd = contentHeight - viewHeight - y;
      const contentGrew = contentHeight > lastContentHeightRef.current;
      lastContentHeightRef.current = contentHeight;

      const atBottom =
        contentHeight <= viewHeight || distanceFromEnd <= BOTTOM_THRESHOLD;
      const notAtBottom =
        contentHeight > viewHeight && distanceFromEnd > NOT_AT_BOTTOM_THRESHOLD;

      if (contentGrew && lastAtBottomRef.current === true && !notAtBottom) {
        isAtBottomRef.current = true;
        lastAtBottomRef.current = true;
        if (scrollThrottleRef.current) {
          clearTimeout(scrollThrottleRef.current);
          scrollThrottleRef.current = null;
        }
        setIsAtBottom(true);
        return;
      }

      const resolved =
        // eslint-disable-next-line no-nested-ternary
        lastAtBottomRef.current === true
          ? atBottom
          : notAtBottom
            ? false
            : atBottom;

      isAtBottomRef.current = resolved;

      if (lastAtBottomRef.current === resolved) return;

      lastAtBottomRef.current = resolved;

      if (scrollThrottleRef.current) return;

      scrollThrottleRef.current = setTimeout(() => {
        scrollThrottleRef.current = null;
        const { current } = isAtBottomRef;
        setIsAtBottom(current);
        if (current) setUnreadCount(0);
      }, SCROLL_THROTTLE_MS);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    if (getMessagesLength() === 0) return;

    isScrollingToBottomRef.current = true;
    setIsScrollingToBottom(true);

    listRef.current?.scrollToEnd?.({ animated: false });

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      lastAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
    }, 0);
  }, [listRef, getMessagesLength]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
    scrollThrottleRef.current = null;
  }, []);

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    unreadCount,
    setUnreadCount,
    handleScroll,
    scrollToBottom,
    incrementUnread,
    cleanup,
  };
};
