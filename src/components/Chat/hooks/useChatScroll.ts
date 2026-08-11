import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { chatScrollActivity } from '../util/chatScrollActivity';

const RETURN_TO_BOTTOM_THRESHOLD = 80;
const USER_SCROLL_AWAY_THRESHOLD = 40;
const SCROLL_DELTA_EPSILON = 1;
// A scroll event this recent means a drag or momentum fling is still running.
const SCROLL_ACTIVITY_WINDOW_MS = 120;
const SCROLL_THROTTLE_MS = 150;
const BOTTOM_CONTENT_CHANGE_ANCHOR_MS = 600;

interface ChatScrollableListRef {
  scrollToEnd?: (options?: { animated?: boolean }) => Promise<void>;
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
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollToBottomRequestRef = useRef(0);
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
  const isMomentumScrollingRef = useRef(false);
  const scrollEndDragSettleRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasUserScrollIntentRef = useRef(false);
  const lastScrollEventAtRef = useRef(0);

  const isUserActivelyScrolling = useCallback(
    () =>
      isDraggingRef.current ||
      isMomentumScrollingRef.current ||
      Date.now() - lastScrollEventAtRef.current < SCROLL_ACTIVITY_WINDOW_MS,
    [],
  );

  const cancelScrollToBottom = useCallback(() => {
    scrollToBottomRequestRef.current += 1;
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

  const scrollToLatestOnce = useCallback(() => {
    if (
      !isAtBottomRef.current ||
      isDraggingRef.current ||
      isMomentumScrollingRef.current
    ) {
      return;
    }

    void listRef.current?.scrollToEnd?.({ animated: false });
  }, [listRef]);

  const handleScrollBeginDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      chatScrollActivity.poke();
      cancelScrollToBottom();
      clearBottomContentAnchor();
      isDraggingRef.current = true;
      isMomentumScrollingRef.current = false;
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
      setShouldMaintainScrollAtEnd(false);
      lastOffsetYRef.current = e.nativeEvent.contentOffset.y;
      if (scrollEndDragSettleRef.current) {
        clearTimeout(scrollEndDragSettleRef.current);
        scrollEndDragSettleRef.current = null;
      }
    },
    [cancelScrollToBottom, clearBottomContentAnchor],
  );

  /**
   * Don't re-enable immediately: a fling fires onMomentumScrollBegin within
   * a few ms, which cancels this timeout and prevents premature re-enable.
   * For a slow drag-release with no fling the timeout fires and re-enables.
   */
  const handleScrollEndDrag = useCallback(() => {
    isDraggingRef.current = false;
    if (scrollEndDragSettleRef.current) {
      clearTimeout(scrollEndDragSettleRef.current);
    }
    scrollEndDragSettleRef.current = setTimeout(() => {
      scrollEndDragSettleRef.current = null;
      if (!isMomentumScrollingRef.current && isAtBottomRef.current) {
        setShouldMaintainScrollAtEnd(true);
      }
    }, 50);
  }, [isAtBottomRef]);

  const handleMomentumScrollBegin = useCallback(() => {
    isMomentumScrollingRef.current = true;
    if (scrollEndDragSettleRef.current) {
      clearTimeout(scrollEndDragSettleRef.current);
      scrollEndDragSettleRef.current = null;
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    isMomentumScrollingRef.current = false;
    isDraggingRef.current = false;
    if (isAtBottomRef.current) {
      setShouldMaintainScrollAtEnd(true);
    }
  }, [isAtBottomRef]);

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
      lastScrollEventAtRef.current = Date.now();
      if (isDraggingRef.current || isMomentumScrollingRef.current) {
        chatScrollActivity.poke();
      }
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
      const userMovedAwayFromBottom =
        contentHeight > viewHeight &&
        isDraggingRef.current &&
        !atBottom &&
        (!hasPreviousOffset || scrolledUp);

      if (userDraggedAway || userMovedAwayFromBottom) {
        hasUserScrollIntentRef.current = true;
      }

      if (!userDraggedAway && atBottom && hasUserScrollIntentRef.current) {
        markAtBottom();
        return;
      }

      const shouldStayAnchoredToBottom =
        !hasUserScrollIntentRef.current &&
        !isDraggingRef.current &&
        !isMomentumScrollingRef.current;

      const resolved = userDraggedAway
        ? false
        : shouldStayAnchoredToBottom
          ? true
          : hasUserScrollIntentRef.current || isMomentumScrollingRef.current
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
          setShouldMaintainScrollAtEnd(true);
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

    const requestId = scrollToBottomRequestRef.current + 1;
    scrollToBottomRequestRef.current = requestId;
    const finishScroll = () => {
      if (scrollToBottomRequestRef.current !== requestId) {
        return;
      }
      markAtBottom();
      isScrollingToBottomRef.current = false;
      setIsScrollingToBottom(false);
    };

    const scrollRequest = listRef.current?.scrollToEnd?.({ animated: false });
    if (!scrollRequest) {
      finishScroll();
      return;
    }

    void scrollRequest.then(finishScroll);
  }, [listRef, getMessagesLength, markAtBottom]);

  const maintainBottomAfterContentChange = useCallback(() => {
    if (getMessagesLength() === 0 || !isAtBottomRef.current) {
      return;
    }
    if (shouldAnchorBottomOnContentChangeRef.current) {
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
      scrollToLatestOnce();
    }, 0);
  }, [getMessagesLength, markAtBottom, scrollToLatestOnce]);

  const handleContentSizeChange = useCallback(() => {
    if (
      getMessagesLength() === 0 ||
      isDraggingRef.current ||
      isMomentumScrollingRef.current
    ) {
      return;
    }

    if (
      !shouldAnchorBottomOnContentChangeRef.current &&
      !isAtBottomRef.current
    ) {
      return;
    }

    scrollToLatestOnce();
  }, [getMessagesLength, scrollToLatestOnce]);

  const incrementUnread = useCallback((count: number) => {
    setUnreadCount(prev => prev + count);
  }, []);

  const cleanup = useCallback(() => {
    chatScrollActivity.reset();
    cancelScrollToBottom();
    clearBottomContentAnchor();
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    scrollThrottleRef.current = null;
    if (scrollEndDragSettleRef.current) {
      clearTimeout(scrollEndDragSettleRef.current);
      scrollEndDragSettleRef.current = null;
    }
  }, [cancelScrollToBottom, clearBottomContentAnchor]);

  const scrollHandlers = useMemo(
    () => ({
      onContentSizeChange: handleContentSizeChange,
      onEndReached: markAtBottom,
      onMomentumScrollBegin: handleMomentumScrollBegin,
      onMomentumScrollEnd: handleMomentumScrollEnd,
      onScroll: handleScroll,
      onScrollBeginDrag: handleScrollBeginDrag,
      onScrollEndDrag: handleScrollEndDrag,
    }),
    [
      handleContentSizeChange,
      markAtBottom,
      handleMomentumScrollBegin,
      handleMomentumScrollEnd,
      handleScroll,
      handleScrollBeginDrag,
      handleScrollEndDrag,
    ],
  );

  return {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    shouldMaintainScrollAtEnd,
    unreadCount,
    setUnreadCount,
    scrollHandlers,
    scrollToBottom,
    maintainBottomAfterContentChange,
    incrementUnread,
    cleanup,
  };
};
