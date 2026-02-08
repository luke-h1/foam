import { FlashListRef } from '@shopify/flash-list';
import { renderHook, act } from '@testing-library/react-native';
import { RefObject } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useChatScroll } from '../useChatScroll';

interface MockFlashListMethods {
  scrollToIndex: jest.Mock;
  scrollToEnd: jest.Mock;
  scrollToOffset: jest.Mock;
  scrollToItem: jest.Mock;
  prepareForLayoutAnimationRender: jest.Mock;
  recordInteraction: jest.Mock;
  getScrollableNode: jest.Mock;
}

interface MockFlashListRef {
  ref: RefObject<FlashListRef<unknown> | null>;
  mocks: MockFlashListMethods;
}

describe('useChatScroll', () => {
  const createMockFlashListRef = (): MockFlashListRef => {
    const mocks: MockFlashListMethods = {
      scrollToIndex: jest.fn(),
      scrollToEnd: jest.fn(),
      scrollToOffset: jest.fn(),
      scrollToItem: jest.fn(),
      prepareForLayoutAnimationRender: jest.fn(),
      recordInteraction: jest.fn(),
      getScrollableNode: jest.fn(),
    };

    const ref = {
      current: mocks,
    } as unknown as RefObject<FlashListRef<unknown> | null>;

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

  describe('Initial State', () => {
    test('should start at bottom', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtBottomRef.current).toBe(true);
      expect(result.current.isScrollingToBottom).toBe(false);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Scroll Detection', () => {
    test('should detect when scrolled to bottom', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // Scroll to bottom (within threshold of 50px)
      const event = createScrollEvent(
        { y: 950 },
        { height: 500 },
        { height: 1500 },
      );

      act(() => {
        result.current.handleScroll(event);
      });

      expect(result.current.isAtBottom).toBe(true);
    });

    test('should detect when scrolled away from bottom', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // Scroll away from bottom (more than 50px threshold)
      const event = createScrollEvent(
        { y: 500 },
        { height: 500 },
        { height: 1500 },
      );

      act(() => {
        result.current.handleScroll(event);
      });

      expect(result.current.isAtBottom).toBe(false);
    });

    test('should reset unread count when scrolled to bottom', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // First increment unread
      act(() => {
        result.current.incrementUnread(5);
      });
      expect(result.current.unreadCount).toBe(5);

      // Scroll to bottom
      const event = createScrollEvent(
        { y: 950 },
        { height: 500 },
        { height: 1500 },
      );

      act(() => {
        result.current.handleScroll(event);
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Unread Count Management', () => {
    test('should increment unread count', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
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

    test('should allow setting unread count directly', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.setUnreadCount(10);
      });

      expect(result.current.unreadCount).toBe(10);
    });
  });

  describe('Scroll to Bottom', () => {
    test('should trigger scrollToEnd with animation', () => {
      const { ref: flashListRef, mocks } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledWith({
        animated: true,
      });
    });

    test('should set isScrollingToBottom flag', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isScrollingToBottom).toBe(true);

      // After timeout (300ms), should reset
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.isScrollingToBottom).toBe(false);
      expect(result.current.isAtBottom).toBe(true);
    });

    test('should reset unread count after scroll completes', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.incrementUnread(10);
      });

      expect(result.current.unreadCount).toBe(10);

      act(() => {
        result.current.scrollToBottom();
        jest.advanceTimersByTime(300);
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Content Size Change', () => {
    test('should auto-scroll when at bottom and content size changes', () => {
      const { ref: flashListRef, mocks } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // Ensure we're at bottom
      expect(result.current.isAtBottomRef.current).toBe(true);

      act(() => {
        result.current.handleContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledWith({
        animated: false,
      });
    });

    test('should not auto-scroll when not at bottom', () => {
      const { ref: flashListRef, mocks } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // Scroll away from bottom
      const event = createScrollEvent(
        { y: 100 },
        { height: 500 },
        { height: 1500 },
      );

      act(() => {
        result.current.handleScroll(event);
      });

      expect(result.current.isAtBottom).toBe(false);

      // Wait past the grace period so "recently at bottom" no longer applies
      act(() => {
        jest.advanceTimersByTime(400);
      });

      mocks.scrollToEnd.mockClear();

      act(() => {
        result.current.handleContentSizeChange();
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });

    test('should still auto-scroll during grace period after message trimming', () => {
      const { ref: flashListRef, mocks } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      // Confirm at bottom with a scroll event
      const atBottomEvent = createScrollEvent(
        { y: 950 },
        { height: 500 },
        { height: 1500 },
      );
      act(() => {
        result.current.handleScroll(atBottomEvent);
      });
      expect(result.current.isAtBottom).toBe(true);

      // Simulate message trimming: a transient scroll event reports not-at-bottom
      const trimShiftEvent = createScrollEvent(
        { y: 700 },
        { height: 500 },
        { height: 1300 },
      );
      act(() => {
        result.current.handleScroll(trimShiftEvent);
      });
      expect(result.current.isAtBottomRef.current).toBe(false);

      mocks.scrollToEnd.mockClear();

      // Content size change fires within the grace period — should still auto-scroll
      act(() => {
        result.current.handleContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledWith({ animated: false });
    });

    test('should not auto-scroll during manual scroll to bottom', () => {
      const { ref: flashListRef, mocks } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isScrollingToBottom).toBe(true);

      mocks.scrollToEnd.mockClear();

      act(() => {
        result.current.handleContentSizeChange();
      });

      // Should not call again during manual scroll
      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clear timeouts on cleanup', () => {
      const { ref: flashListRef } = createMockFlashListRef();

      const { result } = renderHook(() =>
        useChatScroll<unknown>({
          flashListRef,
        }),
      );

      act(() => {
        result.current.scrollToBottom();
      });

      act(() => {
        result.current.cleanup();
      });

      // Advancing timers should not cause state changes
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // isScrollingToBottom should still be true since cleanup cancelled the timeout
      expect(result.current.isScrollingToBottom).toBe(true);
    });
  });
});
