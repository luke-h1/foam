import { RefObject, useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const RETURN_TO_BOTTOM_THRESHOLD = 80;
const USER_SCROLL_AWAY_THRESHOLD = 40;
const SCROLL_DELTA_EPSILON = 1;
const SCROLL_THROTTLE_MS = 150;
const SCROLL_TO_BOTTOM_RETRY_MS = 50;
const SCROLL_TO_BOTTOM_SETTLE_MS = 300;
const BOTTOM_CONTENT_CHANGE_ANCHOR_MS = 600;

interface ChatScrollableListRef {
  scrollToEnd?: (options?: { animated?: boolean }) => void;
  scrollToIndex?: (params: {
    animated?: boolean;
    index: number;
    viewPosition?: number;
  }) => void | Promise<void>;
}

interface UseChatScrollOptions {
  listRef: RefObject<ChatScrollableListRef | null>;
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
  const [shouldMaintainScrollAtEnd, setShouldMaintainScrollAtEnd] =
    useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const bottomContentAnchorTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const bottomContentAnchorTickRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const shouldAnchorBottomOnContentChangeRef = useRef(false);
  const lastAtBottomRef = useRef<boolean | null>(null);
  const lastContentHeightRef = useRef(0);
  const lastViewHeightRef = useRef(0);
  const lastOffsetYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasUserScrollIntentRef = useRef(false);

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

  const clearBottomContentAnchor = useCallback(() => {
    shouldAnchorBottomOnContentChangeRef.current = false;

    if (bottomContentAnchorTimeoutRef.current) {
      clearTimeout(bottomContentAnchorTimeoutRef.current);
      bottomContentAnchorTimeoutRef.current = null;
    }
    if (bottomContentAnchorTickRef.current) {
      clearTimeout(bottomContentAnchorTickRef.current);
      bottomContentAnchorTickRef.current = null;
    }
  }, []);

  const scrollToEndOnce = useCallback(() => {
    if (!isAtBottomRef.current || isDraggingRef.current) {
      return;
    }

    listRef.current?.scrollToEnd?.({ animated: false });
  }, [listRef]);

  const handleScrollBeginDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      clearScrollToBottomTimers();
      clearBottomContentAnchor();
      isDraggingRef.current = true;
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
      setShouldMaintainScrollAtEnd(false);
      lastOffsetYRef.current = e.nativeEvent.contentOffset.y;
    },
    [clearBottomContentAnchor, clearScrollToBottomTimers],
  );

  const handleScrollEndDrag = useCallback(() => {
    isDraggingRef.current = false;
    if (isAtBottomRef.current) {
      setShouldMaintainScrollAtEnd(true);
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (isAtBottomRef.current) {
      setShouldMaintainScrollAtEnd(true);
    }
  }, []);

  const markAtBottom = useCallback(() => {
    isAtBottomRef.current = true;
    lastAtBottomRef.current = true;
    hasUserScrollIntentRef.current = false;
    setShouldMaintainScrollAtEnd(true);

    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
      scrollThrottleRef.current = null;
    }

    setIsAtBottom(true);
    setUnreadCount(0);
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
      const userDraggedAway =
        contentHeight > viewHeight &&
        isDraggingRef.current &&
        distanceFromEnd > USER_SCROLL_AWAY_THRESHOLD &&
        (!hasPreviousOffset || scrolledUp);

      if (userDraggedAway) {
        hasUserScrollIntentRef.current = true;
      }

      if (!userDraggedAway && atBottom && hasUserScrollIntentRef.current) {
        markAtBottom();
        return;
      }

      if (!hasUserScrollIntentRef.current && !userDraggedAway && !atBottom) {
        markAtBottom();
        return;
      }

      const resolved = userDraggedAway
        ? false
        : hasUserScrollIntentRef.current
          ? atBottom || reachedPreviousEndDuringGrowth
          : true;

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
        setShouldMaintainScrollAtEnd(false);
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
          hasUserScrollIntentRef.current = false;
          setUnreadCount(0);
        }
      }, SCROLL_THROTTLE_MS);
    },
    [markAtBottom],
  );

  const scrollToBottom = useCallback(() => {
    if (getMessagesLength() === 0) {
      return;
    }

    isScrollingToBottomRef.current = true;
    setIsScrollingToBottom(true);

    markAtBottom();

    const scrollToEnd = () => {
      const list = listRef.current;
      if (!list) {
        return;
      }

      list.scrollToEnd?.({ animated: false });
      const newestIndex = getMessagesLength() - 1;
      if (newestIndex < 0) {
        return;
      }
      void list.scrollToIndex?.({
        animated: false,
        index: newestIndex,
        viewPosition: 1,
      });
    };

    scrollToEnd();

    clearScrollToBottomTimers();
    scrollRetryIntervalRef.current = setInterval(
      scrollToEnd,
      SCROLL_TO_BOTTOM_RETRY_MS,
    );
    scrollTimeoutRef.current = setTimeout(() => {
      clearScrollToBottomTimers();
      markAtBottom();
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
    }, SCROLL_TO_BOTTOM_SETTLE_MS);
  }, [clearScrollToBottomTimers, listRef, getMessagesLength, markAtBottom]);

  const maintainBottomAfterContentChange = useCallback(() => {
    if (getMessagesLength() === 0 || !isAtBottomRef.current) {
      return;
    }

    markAtBottom();
    shouldAnchorBottomOnContentChangeRef.current = true;

    if (bottomContentAnchorTimeoutRef.current) {
      clearTimeout(bottomContentAnchorTimeoutRef.current);
    }
    bottomContentAnchorTimeoutRef.current = setTimeout(() => {
      shouldAnchorBottomOnContentChangeRef.current = false;
      bottomContentAnchorTimeoutRef.current = null;
    }, BOTTOM_CONTENT_CHANGE_ANCHOR_MS);

    if (bottomContentAnchorTickRef.current) {
      clearTimeout(bottomContentAnchorTickRef.current);
    }
    bottomContentAnchorTickRef.current = setTimeout(() => {
      bottomContentAnchorTickRef.current = null;
      scrollToEndOnce();
    }, 0);
  }, [getMessagesLength, markAtBottom, scrollToEndOnce]);

  const handleContentSizeChange = useCallback(() => {
    if (!shouldAnchorBottomOnContentChangeRef.current) {
      return;
    }

    scrollToEndOnce();
  }, [scrollToEndOnce]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    clearScrollToBottomTimers();
    clearBottomContentAnchor();
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    scrollThrottleRef.current = null;
  }, [clearBottomContentAnchor, clearScrollToBottomTimers]);

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    shouldMaintainScrollAtEnd,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    handleEndReached: markAtBottom,
    handleContentSizeChange,
    scrollToBottom,
    maintainBottomAfterContentChange,
    incrementUnread,
    cleanup,
  };
};
