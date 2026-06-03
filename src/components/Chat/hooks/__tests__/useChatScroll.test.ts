import { FlashListRef } from '@app/components/FlashList/FlashList';
import { renderHook, act } from '@testing-library/react-native';
import { RefObject } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import type { AnyChatMessageType } from '../../util/messageHandlers';
import { useChatScroll } from '../useChatScroll';

interface MockListMethods {
  scrollToIndex: jest.Mock;
  scrollToEnd: jest.Mock;
  scrollToOffset: jest.Mock;
}

interface MockListRef {
  ref: RefObject<FlashListRef<AnyChatMessageType> | null>;
  mocks: MockListMethods;
}

describe('useChatScroll', () => {
  const createMockListRef = (): MockListRef => {
    const mocks: MockListMethods = {
      scrollToIndex: jest.fn(),
      scrollToEnd: jest.fn(),
      scrollToOffset: jest.fn(),
    };

    const ref = {
      current: mocks,
    } as unknown as RefObject<FlashListRef<AnyChatMessageType> | null>;

    return { ref, mocks };
  };

  const createScrollEvent = (
    contentOffset: { y: number },
    layoutMeasurement: { height: number },
    contentSize: { height: number },
  ): NativeSyntheticEvent<NativeScrollEvent> =>
    ({
      nativeEvent: {
        contentOffset,
        layoutMeasurement,
        contentSize,
      },
    }) as NativeSyntheticEvent<NativeScrollEvent>;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getMessagesLength = (length: number) => () => length;

  describe('Initial State', () => {
    test('should start at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
      expect(result.current.isScrollingToBottom).toBe(false);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    test('should return all required functions', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(typeof result.current.handleScroll).toBe('function');
      expect(typeof result.current.scrollToBottom).toBe('function');
      expect(typeof result.current.maintainBottomAfterContentChange).toBe(
        'function',
      );
      expect(typeof result.current.handleContentSizeChange).toBe('function');
      expect(typeof result.current.cleanup).toBe('function');
      expect(typeof result.current.incrementUnread).toBe('function');
    });
  });

  describe('Scroll Detection (normal list: bottom = end of content)', () => {
    test('should detect when user scrolls away from bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // Scrolled up: y=500, view 500, content 2000 -> distanceFromEnd = 1000.
      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.isAtBottomRef.current).toBe(false);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(false);
    });

    test('should disable bottom anchoring as soon as the user starts dragging', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });

      expect(result.current.isAtBottomRef.current).toBe(true);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(false);

      act(() => {
        result.current.handleScrollEndDrag();
      });

      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);
    });

    test('should detect when user scrolls back to bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(false);

      // Scrolled to end: y=1500, view 500, content 2000 -> distanceFromEnd = 0.
      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(true);
    });

    test('should consider within return threshold as at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // Near end: y=1440 -> distanceFromEnd = 60.
      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1440 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(true);
    });

    test('should show jump affordance after a small upward drag', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 1440 }, { height: 500 }, { height: 2000 }),
        );
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.isAtBottomRef.current).toBe(false);
    });

    test('should stay at bottom when fast message growth arrives before autoscroll', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2200 }),
        );
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
    });

    test('should stay at bottom when layout height changes during rotation', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 380 }, { height: 2000 }),
        );
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
    });

    test('should dismiss jump affordance when user reaches the previous bottom while new messages arrive', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(false);

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2200 }),
        );
      });

      expect(result.current.isAtBottomRef.current).toBe(true);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottom).toBe(true);
    });
  });

  describe('Unread Count', () => {
    test('unread is only updated via incrementUnread (parent responsibility)', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.incrementUnread(5);
      });
      expect(result.current.unreadCount).toBe(5);
    });

    test('should not increment unread when at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(15),
        }),
      );

      expect(result.current.unreadCount).toBe(0);
    });

    test('should clear unread count when scrolling to bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        result.current.incrementUnread(5);
      });
      expect(result.current.unreadCount).toBe(5);

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.unreadCount).toBe(0);
    });

    test('should clear jump affordance when FlashList reports end reached', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        result.current.incrementUnread(260);
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.unreadCount).toBe(260);

      act(() => {
        result.current.handleEndReached();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    test('should increment unread manually', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.incrementUnread(3);
      });

      expect(result.current.unreadCount).toBe(3);

      act(() => {
        result.current.incrementUnread(2);
      });

      expect(result.current.unreadCount).toBe(5);
    });
  });

  describe('Scroll to Bottom', () => {
    test('should call scrollToEnd for normal list', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledWith({
        animated: false,
      });
    });

    test('should mark bottom intent immediately when jumping to latest', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        result.current.incrementUnread(5);
      });
      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.unreadCount).toBe(5);

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isScrollingToBottom).toBe(true);
    });

    test('should keep retrying scrollToEnd while jump-to-latest settles', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });
      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);
      expect(result.current.isScrollingToBottom).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current.isScrollingToBottom).toBe(false);
    });

    test('should set isScrollingToBottom during scroll', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isScrollingToBottom).toBe(true);

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(result.current.isScrollingToBottom).toBe(false);
    });

    test('should clear unread after scroll completes', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        result.current.incrementUnread(5);
      });
      expect(result.current.unreadCount).toBe(5);

      act(() => {
        result.current.scrollToBottom();
        jest.advanceTimersByTime(350);
      });

      expect(result.current.unreadCount).toBe(0);
    });

    test('should not scroll when messages length is 0', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(0),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });
  });

  describe('Bottom anchoring after content height changes', () => {
    test('should keep bottom pinned during bounded hydrated content changes', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.maintainBottomAfterContentChange();
      });

      expect(result.current.isScrollingToBottom).toBe(false);

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);

      act(() => {
        jest.advanceTimersByTime(600);
        result.current.handleContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);
    });

    test('should coalesce repeated bottom anchoring calls while active', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.maintainBottomAfterContentChange();
        result.current.maintainBottomAfterContentChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(600);
        result.current.maintainBottomAfterContentChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);
    });

    test('should cancel hydrated content anchoring when the user drags away', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.maintainBottomAfterContentChange();
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });

    test('should not arm hydrated content anchoring when already away from bottom', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.handleScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottomRef.current).toBe(false);

      act(() => {
        result.current.maintainBottomAfterContentChange();
        result.current.handleContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clear timeouts on cleanup', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isScrollingToBottom).toBe(true);

      act(() => {
        result.current.cleanup();
      });

      // Timeout should be cleared, but we can't easily verify this
      // Just ensure cleanup doesn't throw
    });
  });
});
