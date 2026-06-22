import { act, renderHook } from '@testing-library/react-native';

import { addMessages } from '@app/store/chat/actions/messages';
import type { ChatMessageType } from '@app/store/chat/types/constants';

import { useChatMessages } from '../useChatMessages';

jest.mock('@app/store/chat/actions/messages', () => ({
  addMessages: jest.fn(),
  getMaxChatMessages: jest.fn(() => 600),
}));

const mockAddMessages = jest.mocked(addMessages);

function getLastFlushedMessages(): ChatMessageType<never>[] {
  const lastCall = mockAddMessages.mock.calls.at(-1);
  const messages = lastCall?.[0];
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.filter(
    (message): message is ChatMessageType<never> => message != null,
  );
}

describe('useChatMessages', () => {
  const createMockMessage = (
    id: string,
    nonce?: string,
  ): ChatMessageType<never> => ({
    id: `${id}_${nonce || `nonce-${id}`}`,
    message_id: id,
    message_nonce: nonce || `nonce-${id}`,
    message: [{ type: 'text', content: `Message ${id}` }],
    channel: 'test-channel',
    sender: 'TestUser',
    badges: [],
    userstate: {
      'display-name': 'TestUser',
      login: 'testuser',
      username: 'TestUser',
      'user-id': '123',
      id,
      color: '#FF0000',
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  });

  const defaultOptions = {
    isAtBottomRef: { current: true },
    onUnreadIncrement: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    test('should return required functions', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      expect(typeof result.current.handleNewMessage).toBe('function');
      expect(typeof result.current.clearLocalMessages).toBe('function');
      expect(typeof result.current.cleanup).toBe('function');
      expect(typeof result.current.forceFlush).toBe('function');
      expect(typeof result.current.getBufferSize).toBe('function');
    });

    test('should start with empty buffer', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      expect(result.current.getBufferSize()).toBe(0);
    });

    test('should return referentially stable handlers across re-renders', () => {
      // Downstream IRC handlers list these in their useCallback deps; a fresh
      // identity per render would rebuild every chat handler on each render.
      const { result, rerender } = renderHook(() =>
        useChatMessages(defaultOptions),
      );

      const firstRender = { ...result.current };

      rerender(undefined);

      expect(result.current.handleNewMessage).toBe(
        firstRender.handleNewMessage,
      );
      expect(result.current.clearLocalMessages).toBe(
        firstRender.clearLocalMessages,
      );
      expect(result.current.removeBufferedMessageById).toBe(
        firstRender.removeBufferedMessageById,
      );
      expect(result.current.removeBufferedMessagesByLogin).toBe(
        firstRender.removeBufferedMessagesByLogin,
      );
      expect(result.current.moderateBufferedMessageById).toBe(
        firstRender.moderateBufferedMessageById,
      );
      expect(result.current.moderateBufferedMessagesByLogin).toBe(
        firstRender.moderateBufferedMessagesByLogin,
      );
      expect(result.current.cleanup).toBe(firstRender.cleanup);
      expect(result.current.forceFlush).toBe(firstRender.forceFlush);
      expect(result.current.getBufferSize).toBe(firstRender.getBufferSize);
    });
  });

  describe('Message Buffering', () => {
    test('keeps flushing after a flush throws, so the chat cannot freeze', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          isAtBottomRef: { current: false },
          onUnreadIncrement,
        }),
      );

      onUnreadIncrement.mockImplementationOnce(() => {
        throw new Error('flush boom');
      });

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
      });
      try {
        act(() => {
          jest.advanceTimersByTime(250);
        });
      } catch {
        // ignore
      }
      expect(mockAddMessages).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleNewMessage(createMockMessage('2'));
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(mockAddMessages).toHaveBeenCalledTimes(2);
    });

    test('should buffer messages and flush periodically', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      const message = createMockMessage('1');

      act(() => {
        result.current.handleNewMessage(message);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();
      expect(result.current.getBufferSize()).toBe(1);

      act(() => {
        jest.advanceTimersByTime(99);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      const [flushedMessage] = getLastFlushedMessages();
      expect(flushedMessage?.message_id).toBe('1');
      expect(flushedMessage?.message_nonce).toBe('nonce-1');
      expect(result.current.getBufferSize()).toBe(0);
    });

    test('uses the wider batch window when the user is reading backlog', () => {
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        jest.advanceTimersByTime(249);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      const [flushedMessage] = getLastFlushedMessages();
      expect(flushedMessage?.message_id).toBe('1');
      expect(flushedMessage?.message_nonce).toBe('nonce-1');
      expect(result.current.getBufferSize()).toBe(0);
    });

    test('should flush when not at bottom so messages always appear', () => {
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
        jest.advanceTimersByTime(250);
      });

      expect(mockAddMessages).toHaveBeenCalled();
      expect(result.current.getBufferSize()).toBe(0);
    });

    test('lets LegendList maintain the bottom after live messages flush at bottom', () => {
      const onBottomContentChange = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: true },
          onBottomContentChange,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        jest.advanceTimersByTime(100);
      });

      const [flushedMessage] = getLastFlushedMessages();
      expect(flushedMessage?.message_id).toBe('1');
      expect(flushedMessage?.message_nonce).toBe('nonce-1');
      expect(onBottomContentChange).not.toHaveBeenCalled();
    });

    test('arms bottom anchoring while an explicit scroll-to-bottom is settling', () => {
      const onBottomContentChange = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          isScrollingToBottomRef: { current: true },
          onBottomContentChange,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        jest.advanceTimersByTime(100);
      });

      const [flushedMessage] = getLastFlushedMessages();
      expect(flushedMessage?.message_id).toBe('1');
      expect(flushedMessage?.message_nonce).toBe('nonce-1');
      expect(onBottomContentChange).toHaveBeenCalledTimes(1);
    });

    test('does not arm bottom anchoring when the user is reading backlog', () => {
      const onBottomContentChange = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          onBottomContentChange,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        jest.advanceTimersByTime(250);
      });

      expect(mockAddMessages).toHaveBeenCalled();
      expect(onBottomContentChange).not.toHaveBeenCalled();
    });

    test('should deduplicate messages in buffer', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      const message1 = createMockMessage('1', 'shared-nonce');
      const message2 = createMockMessage('1', 'shared-nonce');

      act(() => {
        result.current.handleNewMessage(message1);
        result.current.handleNewMessage(message2);
      });

      expect(result.current.getBufferSize()).toBe(1);
    });

    test('should keep messages with different nonces', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        result.current.handleNewMessage(createMockMessage('1', 'nonce-a'));
        result.current.handleNewMessage(createMockMessage('1', 'nonce-b'));
      });

      expect(result.current.getBufferSize()).toBe(2);
    });
  });

  describe('Force Flush (Resume Scroll)', () => {
    test('should flush all buffered messages on forceFlush', () => {
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
        result.current.handleNewMessage(createMockMessage('3'));
      });

      expect(result.current.getBufferSize()).toBe(3);
      expect(mockAddMessages).not.toHaveBeenCalled();

      act(() => {
        result.current.forceFlush();
      });

      expect(
        getLastFlushedMessages().map(message => message.message_id),
      ).toEqual(['1', '2', '3']);
      expect(result.current.getBufferSize()).toBe(0);
    });
  });

  describe('Unread Count', () => {
    test('should batch unread increments while not at bottom', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          onUnreadIncrement,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
      });

      expect(onUnreadIncrement).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(onUnreadIncrement).toHaveBeenCalledTimes(1);
      expect(onUnreadIncrement).toHaveBeenCalledWith(2);
    });

    test('should not increment unread when at bottom', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: true },
          onUnreadIncrement,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
      });

      expect(onUnreadIncrement).not.toHaveBeenCalled();
    });

    test('flushes pending unread count on forceFlush', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          onUnreadIncrement,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
        result.current.forceFlush();
      });

      expect(onUnreadIncrement).toHaveBeenCalledTimes(1);
      expect(onUnreadIncrement).toHaveBeenCalledWith(2);
    });

    test('should not increment unread while jumping to bottom', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          isScrollingToBottomRef: { current: true },
          onUnreadIncrement,
        }),
      );

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
      });

      expect(onUnreadIncrement).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clear flush timer on cleanup', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
      });

      act(() => {
        result.current.cleanup();
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();
    });

    test('should clear buffer on clearLocalMessages', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
      });

      expect(result.current.getBufferSize()).toBe(2);

      act(() => {
        result.current.clearLocalMessages();
      });

      expect(result.current.getBufferSize()).toBe(0);
    });
  });

  describe('High volume', () => {
    // Reading history (scrolled up): a delayed flush must commit the whole
    // backlog so nothing the store would keep is lost. Raid sampling only
    // applies at the bottom (see the test below it).
    const scrolledUpOptions = {
      ...defaultOptions,
      isAtBottomRef: { current: false },
    };

    test('should flush entire buffer so all messages appear', () => {
      const { result } = renderHook(() => useChatMessages(scrolledUpOptions));

      act(() => {
        for (let i = 0; i < 250; i += 1) {
          result.current.handleNewMessage(createMockMessage(`${i}`));
        }
      });

      expect(result.current.getBufferSize()).toBe(250);

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(mockAddMessages).toHaveBeenCalledTimes(1);
      const flushedMessages = getLastFlushedMessages();
      expect(flushedMessages).toHaveLength(250);
      expect(flushedMessages[0]?.message_id).toBe('0');
      expect(flushedMessages.at(-1)?.message_id).toBe('249');
      expect(result.current.getBufferSize()).toBe(0);
    });

    test('caps pending messages when flushing is delayed', () => {
      const { result } = renderHook(() => useChatMessages(scrolledUpOptions));

      act(() => {
        for (let i = 0; i < 700; i += 1) {
          result.current.handleNewMessage(createMockMessage(`${i}`));
        }
      });

      expect(result.current.getBufferSize()).toBe(600);

      act(() => {
        // Scrolled up uses the backlog flush interval (250ms).
        jest.advanceTimersByTime(250);
      });

      const firstCall = mockAddMessages.mock.calls[0];
      const flushedMessages = firstCall?.[0] ?? [];

      expect(flushedMessages).toHaveLength(600);
      expect(flushedMessages[0]?.message_id).toBe('100');
      expect(flushedMessages.at(-1)?.message_id).toBe('699');
    });

    test('samples a live raid at the bottom to the newest rows per flush', () => {
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: true },
        }),
      );

      // A burst of 50 messages lands in one flush window while following live.
      act(() => {
        for (let i = 0; i < 50; i += 1) {
          result.current.handleNewMessage(createMockMessage(`${i}`));
        }
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const flushedMessages = getLastFlushedMessages();
      // Only the newest MAX_LIVE_COMMIT_PER_FLUSH (3) commit; older overflow is
      // dropped because it would have scrolled past unread anyway.
      expect(flushedMessages).toHaveLength(3);
      expect(flushedMessages[0]?.message_id).toBe('47');
      expect(flushedMessages.at(-1)?.message_id).toBe('49');
    });

    test('caps pending unread count with the retained high-volume buffer', () => {
      const onUnreadIncrement = jest.fn();
      const { result } = renderHook(() =>
        useChatMessages({
          ...defaultOptions,
          isAtBottomRef: { current: false },
          onUnreadIncrement,
        }),
      );

      act(() => {
        for (let i = 0; i < 700; i += 1) {
          result.current.handleNewMessage(createMockMessage(`${i}`));
        }
        jest.advanceTimersByTime(250);
      });

      expect(onUnreadIncrement).toHaveBeenCalledTimes(1);
      expect(onUnreadIncrement).toHaveBeenCalledWith(600);
    });
  });
});
