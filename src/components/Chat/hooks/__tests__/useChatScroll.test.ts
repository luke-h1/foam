import { RefObject } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { act, renderHook } from '@testing-library/react-native';

import type { ChatListRef } from '@app/components/Chat/components/ChatList';
import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';
import {
  getChatUnreadCount,
  incrementChatUnread,
  resetChatUnread,
} from '@app/store/chat/actions/chatUnread';
import { createRef } from '@app/test/createRef';

import { useChatScroll } from '../useChatScroll';

interface MockListMethods {
  scrollToIndex: jest.Mock;
  scrollToEnd: jest.Mock;
  scrollToOffset: jest.Mock;
}

interface MockListRef {
  ref: RefObject<ChatListRef | null>;
  mocks: MockListMethods;
}

describe('useChatScroll', () => {
  const createMockListRef = (): MockListRef => {
    const mocks: MockListMethods = {
      scrollToIndex: jest.fn(),
      scrollToEnd: jest.fn(() => new Promise<void>(() => {})),
      scrollToOffset: jest.fn(),
    };

    const ref = createRef<ChatListRef | null>(mocks as unknown as ChatListRef);

    return { ref, mocks };
  };

  const createScrollEvent = (
    contentOffset: { y: number },
    layoutMeasurement: { height: number },
    contentSize: { height: number },
  ): NativeSyntheticEvent<NativeScrollEvent> =>
    ({
      nativeEvent: {
        contentOffset: { x: 0, ...contentOffset },
        layoutMeasurement: { width: 0, ...layoutMeasurement },
        contentSize: { width: 0, ...contentSize },
        contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
        contentOffsetAnimatedValue: undefined,
        zoomScale: 1,
        velocity: { x: 0, y: 0 },
      },
      currentTarget:
        {} as NativeSyntheticEvent<NativeScrollEvent>['currentTarget'],
      target: {} as NativeSyntheticEvent<NativeScrollEvent>['target'],
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isDefaultPrevented: () => false,
      isPropagationStopped: () => false,
      persist: () => {},
      preventDefault: () => {},
      stopPropagation: () => {},
      timeStamp: 0,
      type: 'scroll',
    }) as unknown as NativeSyntheticEvent<NativeScrollEvent>;

  beforeEach(() => {
    jest.useFakeTimers();
    resetChatUnread();
  });

  afterEach(() => {
    chatScrollActivity.reset();
    jest.useRealTimers();
  });

  const getMessagesLength = (length: number) => () => length;

  describe('scroll activity signal (emote animation pause)', () => {
    test('programmatic auto-scroll does not flag activity; a user drag does', () => {
      chatScrollActivity.reset();
      const { ref: listRef } = createMockListRef();
      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1900 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(chatScrollActivity.isActive()).toBe(false);

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(chatScrollActivity.isActive()).toBe(true);

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(chatScrollActivity.isActive()).toBe(false);
    });
  });

  describe('Initial State', () => {
    test('starts at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
      expect(result.current.isScrollingToBottom).toBe(false);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);
      expect(getChatUnreadCount()).toBe(0);
    });

    test('returns all required functions', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(typeof result.current.scrollHandlers.onScroll).toBe('function');
      expect(typeof result.current.scrollToBottom).toBe('function');
      expect(
        typeof result.current.scrollAnchor.maintainBottomAfterContentChange,
      ).toBe('function');
      expect(typeof result.current.scrollHandlers.onContentSizeChange).toBe(
        'function',
      );
      expect(typeof result.current.cleanup).toBe('function');
      expect(typeof result.current.scrollAnchor.isUserActivelyScrolling).toBe(
        'function',
      );
    });
  });

  describe('Scroll Detection (normal list: bottom = end of content)', () => {
    test('detects when user scrolls away from bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // Scrolled up: y=500, view 500, content 2000 -> distanceFromEnd = 1000.
      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(false);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(false);
    });

    test('disables bottom anchoring as soon as the user starts dragging', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });

      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
      expect(result.current.shouldMaintainScrollAtEnd).toBe(false);

      act(() => {
        result.current.scrollHandlers.onScrollEndDrag();
      });

      // End-drag re-enables after a settle window so a fling's
      // onMomentumScrollBegin can cancel it first.
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(result.current.shouldMaintainScrollAtEnd).toBe(true);
    });

    test('detects when user scrolls back to bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(false);

      // Scrolled to end: y=1500, view 500, content 2000 -> distanceFromEnd = 0.
      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(true);
    });

    test('considers within return threshold as at bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // Near end: y=1440 -> distanceFromEnd = 60.
      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1440 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(true);
    });

    test('shows jump affordance after a small upward drag', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1440 }, { height: 500 }, { height: 2000 }),
        );
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(false);
    });

    test('stays at bottom when fast message growth arrives before autoscroll', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2200 }),
        );
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
    });

    test('stays at bottom when layout height changes during rotation', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      expect(result.current.isAtBottom).toBe(true);

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 380 }, { height: 2000 }),
        );
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
    });

    test('dismisses jump affordance when user reaches the previous bottom while new messages arrive', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.isAtBottom).toBe(false);

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2200 }),
        );
      });

      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isAtBottom).toBe(true);
    });
  });

  describe('Unread Count', () => {
    test('unread is only updated via the chatUnread action (ingest responsibility)', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        incrementChatUnread(5);
      });
      expect(getChatUnreadCount()).toBe(5);
    });

    test('does not increment unread when at bottom', () => {
      const { ref: listRef } = createMockListRef();

      renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(15),
        }),
      );

      expect(getChatUnreadCount()).toBe(0);
    });

    test('clears unread count when scrolling to bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        incrementChatUnread(5);
      });
      expect(getChatUnreadCount()).toBe(5);

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(getChatUnreadCount()).toBe(0);
    });

    test('clears jump affordance when FlashList reports end reached', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        incrementChatUnread(260);
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(getChatUnreadCount()).toBe(260);

      act(() => {
        result.current.scrollHandlers.onEndReached();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
      expect(getChatUnreadCount()).toBe(0);
    });

    test('increments unread manually', () => {
      const { ref: listRef } = createMockListRef();

      renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        incrementChatUnread(3);
      });

      expect(getChatUnreadCount()).toBe(3);

      act(() => {
        incrementChatUnread(2);
      });

      expect(getChatUnreadCount()).toBe(5);
    });
  });

  describe('Scroll to Bottom', () => {
    test('calls scrollToEnd for normal list', () => {
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

    test('marks bottom intent immediately when jumping to latest', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        incrementChatUnread(5);
      });
      expect(result.current.isAtBottom).toBe(false);
      expect(getChatUnreadCount()).toBe(5);

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(true);
      expect(getChatUnreadCount()).toBe(0);
      expect(result.current.isScrollingToBottom).toBe(true);
    });

    test('issues one end request and settle when LegendList finishes', async () => {
      const { ref: listRef, mocks } = createMockListRef();
      let finishScroll: (() => void) | undefined;
      mocks.scrollToEnd.mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            finishScroll = resolve;
          }),
      );

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
      expect(result.current.isScrollingToBottom).toBe(true);

      await act(async () => {
        finishScroll?.();
        await Promise.resolve();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);
      expect(result.current.isScrollingToBottom).toBe(false);
    });

    test('clears unread when jumping to the bottom', () => {
      const { ref: listRef } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      act(() => {
        incrementChatUnread(5);
      });
      expect(getChatUnreadCount()).toBe(5);

      act(() => {
        result.current.scrollToBottom();
      });

      expect(getChatUnreadCount()).toBe(0);
    });

    test('does not scroll when messages length is 0', () => {
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

    test('keeps treating a momentum fling as active between scroll events', () => {
      const { ref: listRef } = createMockListRef();
      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 1000 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScrollEndDrag();
        result.current.scrollHandlers.onMomentumScrollBegin();
        jest.advanceTimersByTime(200);
      });

      expect(result.current.scrollAnchor.isUserActivelyScrolling()).toBe(true);

      act(() => {
        result.current.scrollHandlers.onMomentumScrollEnd();
      });

      expect(result.current.scrollAnchor.isUserActivelyScrolling()).toBe(false);
    });
  });

  describe('Bottom anchoring after content height changes', () => {
    test('keeps bottom pinned during bounded hydrated content changes', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
        result.current.cleanup();
        mocks.scrollToEnd.mockClear();
        result.current.scrollAnchor.maintainBottomAfterContentChange();
      });

      expect(result.current.isScrollingToBottom).toBe(true);

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.scrollHandlers.onContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);

      // Even after the hydration anchor window expires, a content-size change
      // while still pinned to the bottom keeps the newest row fully visible -
      // otherwise an under-estimated emote/username row stays clipped at the
      // viewport bottom.
      act(() => {
        jest.advanceTimersByTime(600);
        result.current.scrollHandlers.onContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(3);
    });

    test('coalesces repeated bottom anchoring calls while active', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
        result.current.cleanup();
        mocks.scrollToEnd.mockClear();
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(600);
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);
    });

    test('keeps bottom pinned when hydrated content changes while already at bottom', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        result.current.scrollHandlers.onContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);
    });

    test('re-pins to the newest row on content-size change while passively at the bottom', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      // No scrollToBottom / maintainBottomAfterContentChange: this mirrors the
      // live stream of messages arriving while the user simply sits at the
      // bottom. The newest row must still be re-revealed after its real (often
      // under-estimated) height is measured.
      act(() => {
        result.current.scrollHandlers.onContentSizeChange();
      });

      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(1);
    });

    test('cancels hydrated content anchoring when the user drags away', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });

    test('does not re-pin while an upward momentum fling is active', () => {
      const { ref: listRef, mocks } = createMockListRef();
      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onMomentumScrollBegin();
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        result.current.scrollHandlers.onContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });

    test('does not arm hydrated content anchoring when already away from bottom', () => {
      const { ref: listRef, mocks } = createMockListRef();

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollHandlers.onScrollBeginDrag(
          createScrollEvent({ y: 1500 }, { height: 500 }, { height: 2000 }),
        );
        result.current.scrollHandlers.onScroll(
          createScrollEvent({ y: 500 }, { height: 500 }, { height: 2000 }),
        );
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.scrollAnchor.isAtBottomRef.current).toBe(false);

      act(() => {
        result.current.scrollAnchor.maintainBottomAfterContentChange();
        result.current.scrollHandlers.onContentSizeChange();
        jest.advanceTimersByTime(0);
      });

      expect(mocks.scrollToEnd).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('ignores an obsolete scroll completion after a newer jump', async () => {
      const { ref: listRef, mocks } = createMockListRef();
      let finishFirstScroll: (() => void) | undefined;
      let finishSecondScroll: (() => void) | undefined;
      mocks.scrollToEnd
        .mockImplementationOnce(
          () =>
            new Promise<void>(resolve => {
              finishFirstScroll = resolve;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<void>(resolve => {
              finishSecondScroll = resolve;
            }),
        );

      const { result } = renderHook(() =>
        useChatScroll({
          listRef,
          getMessagesLength: getMessagesLength(10),
        }),
      );

      act(() => {
        result.current.scrollToBottom();
        result.current.scrollToBottom();
      });

      expect(result.current.isScrollingToBottom).toBe(true);
      expect(mocks.scrollToEnd).toHaveBeenCalledTimes(2);

      await act(async () => {
        finishFirstScroll?.();
        await Promise.resolve();
      });
      expect(result.current.isScrollingToBottom).toBe(true);

      await act(async () => {
        finishSecondScroll?.();
        await Promise.resolve();
      });
      expect(result.current.isScrollingToBottom).toBe(false);
    });
  });
});
