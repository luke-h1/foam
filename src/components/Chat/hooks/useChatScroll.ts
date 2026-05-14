import { FlashListRef } from '@app/components/FlashList/FlashList';
import { RefObject, useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';

const RETURN_TO_BOTTOM_THRESHOLD = 80;
const USER_SCROLL_AWAY_THRESHOLD = 40;
const SCROLL_DELTA_EPSILON = 1;
const SCROLL_THROTTLE_MS = 150;
const SCROLL_TO_BOTTOM_RETRY_MS = 50;
const SCROLL_TO_BOTTOM_SETTLE_MS = 300;

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
  const scrollRetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastAtBottomRef = useRef<boolean | null>(null);
  const lastContentHeightRef = useRef(0);
  const lastViewHeightRef = useRef(0);
  const lastOffsetYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const clearScrollToBottomTimers = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (scrollRetryIntervalRef.current) {
      clearInterval(scrollRetryIntervalRef.current);
      scrollRetryIntervalRef.current = null;
    }
  }, []);

  const handleScrollBeginDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      clearScrollToBottomTimers();
      isDraggingRef.current = true;
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
      lastOffsetYRef.current = e.nativeEvent.contentOffset.y;
    },
    [clearScrollToBottomTimers],
  );

  const handleScrollEndDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const { y } = contentOffset;
      const contentHeight = contentSize?.height ?? 0;
      const viewHeight = layoutMeasurement?.height ?? 0;
      const distanceFromEnd = Math.max(0, contentHeight - viewHeight - y);
      const previousContentHeight = lastContentHeightRef.current;
      const previousViewHeight = lastViewHeightRef.current;
      const previousOffsetY = lastOffsetYRef.current;
      const hasPreviousOffset = previousOffsetY !== null;
      const scrolledUp =
        hasPreviousOffset && y < previousOffsetY - SCROLL_DELTA_EPSILON;
      const scrolledDownOrStationary =
        !hasPreviousOffset || y >= previousOffsetY - SCROLL_DELTA_EPSILON;
      const contentGrew = contentHeight > lastContentHeightRef.current;
      const layoutChanged =
        Math.abs(viewHeight - lastViewHeightRef.current) > SCROLL_DELTA_EPSILON;
      const previousDistanceFromEnd =
        previousContentHeight > previousViewHeight
          ? Math.max(0, previousContentHeight - previousViewHeight - y)
          : 0;
      const reachedPreviousEndDuringGrowth =
        contentGrew &&
        scrolledDownOrStationary &&
        previousDistanceFromEnd <= RETURN_TO_BOTTOM_THRESHOLD;
      lastContentHeightRef.current = contentHeight;
      lastViewHeightRef.current = viewHeight;
      lastOffsetYRef.current = y;

      const atBottom =
        contentHeight <= viewHeight ||
        distanceFromEnd <= RETURN_TO_BOTTOM_THRESHOLD;
      const userScrolledAway =
        contentHeight > viewHeight &&
        distanceFromEnd > USER_SCROLL_AWAY_THRESHOLD &&
        (isDraggingRef.current
          ? !hasPreviousOffset || scrolledUp
          : hasPreviousOffset
            ? scrolledUp && !contentGrew && !layoutChanged
            : distanceFromEnd > RETURN_TO_BOTTOM_THRESHOLD);

      if (lastAtBottomRef.current !== false && !userScrolledAway && !atBottom) {
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
        lastAtBottomRef.current === false
          ? atBottom || reachedPreviousEndDuringGrowth
          : !userScrolledAway;

      isAtBottomRef.current = resolved;

      if (lastAtBottomRef.current === resolved) {
        return;
      }

      lastAtBottomRef.current = resolved;

      if (resolved === false) {
        if (scrollThrottleRef.current) {
          clearTimeout(scrollThrottleRef.current);
          scrollThrottleRef.current = null;
        }
        setIsAtBottom(false);
        return;
      }

      if (scrollThrottleRef.current) {
        return;
      }

      scrollThrottleRef.current = setTimeout(() => {
        scrollThrottleRef.current = null;
        const { current } = isAtBottomRef;
        setIsAtBottom(current);
        if (current) {
          setUnreadCount(0);
        }
      }, SCROLL_THROTTLE_MS);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    if (getMessagesLength() === 0) {
      return;
    }

    isScrollingToBottomRef.current = true;
    setIsScrollingToBottom(true);

    isAtBottomRef.current = true;
    lastAtBottomRef.current = true;
    setIsAtBottom(true);
    setUnreadCount(0);

    const scrollToEnd = () => {
      listRef.current?.scrollToEnd?.({ animated: false });
    };

    scrollToEnd();

    clearScrollToBottomTimers();
    scrollRetryIntervalRef.current = setInterval(
      scrollToEnd,
      SCROLL_TO_BOTTOM_RETRY_MS,
    );
    scrollTimeoutRef.current = setTimeout(() => {
      clearScrollToBottomTimers();
      isAtBottomRef.current = true;
      lastAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
    }, SCROLL_TO_BOTTOM_SETTLE_MS);
  }, [clearScrollToBottomTimers, listRef, getMessagesLength]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    clearScrollToBottomTimers();
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    scrollThrottleRef.current = null;
  }, [clearScrollToBottomTimers]);

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    scrollToBottom,
    incrementUnread,
    cleanup,
  };
};
