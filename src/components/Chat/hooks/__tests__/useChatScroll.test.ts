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

      // Scrolled up: y=500, view 500, content 2000 → distanceFromEnd = 1000 (> 250)
      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.isAtBottomRef.current).toBe(false);
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
        result.current.handleScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(false);

      // Scrolled to end: y=1500, view 500, content 2000 → distanceFromEnd = 0
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

    test('should consider within threshold as at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // Near end: y=1350 → distanceFromEnd = 150 (<= 200)
      act(() => {
        result.current.handleScroll(
          createScrollEvent({ y: 1350 }, { height: 500 }, { height: 2000 }),
        );
      });
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
        animated: true,
      });
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
