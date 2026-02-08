import { addMessages, ChatMessageType } from '@app/store/chatStore';
import { renderHook, act } from '@testing-library/react-native';
import { useChatMessages } from '../useChatMessages';

jest.mock('@app/store/chatStore', () => ({
  addMessages: jest.fn(),
}));

const mockAddMessages = addMessages as jest.MockedFunction<typeof addMessages>;

describe('useChatMessages', () => {
  const createMockMessage = (
    id: string,
    nonce?: string,
  ): ChatMessageType<never> =>
    ({
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
    }) as ChatMessageType<never>;

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
    });
  });

  describe('Message Batching', () => {
    test('should batch messages and process after timeout', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      const message = createMockMessage('1');

      act(() => {
        result.current.handleNewMessage(message);
      });

      // Message should not be added immediately
      expect(mockAddMessages).not.toHaveBeenCalled();

      // After batch timeout (10ms)
      act(() => {
        jest.advanceTimersByTime(15);
      });

      expect(mockAddMessages).toHaveBeenCalledWith([message]);
    });

    test('should process immediately when batch size reached', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      // Send 3 messages (BATCH_SIZE)
      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.handleNewMessage(createMockMessage('2'));
        result.current.handleNewMessage(createMockMessage('3'));
      });

      // Should process immediately without waiting for timeout
      expect(mockAddMessages).toHaveBeenCalledTimes(1);
      expect(mockAddMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message_id: '1' }),
          expect.objectContaining({ message_id: '2' }),
          expect.objectContaining({ message_id: '3' }),
        ]),
      );
    });

    test('should deduplicate messages within batch', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      // Same message_id and message_nonce should be deduplicated
      const message1 = createMockMessage('1', 'shared-nonce');
      const message2 = createMockMessage('1', 'shared-nonce');

      act(() => {
        result.current.handleNewMessage(message1);
        result.current.handleNewMessage(message2);
        jest.advanceTimersByTime(15);
      });

      expect(mockAddMessages).toHaveBeenCalledWith([message2]); // Last one wins
    });

    test('should keep messages with different nonces', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      const message1 = createMockMessage('1', 'nonce-a');
      const message2 = createMockMessage('1', 'nonce-b');

      act(() => {
        result.current.handleNewMessage(message1);
        result.current.handleNewMessage(message2);
        jest.advanceTimersByTime(15);
      });

      expect(mockAddMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message_nonce: 'nonce-a' }),
          expect.objectContaining({ message_nonce: 'nonce-b' }),
        ]),
      );
    });
  });

  describe('Unread Count', () => {
    test('should increment unread when not at bottom', () => {
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
        jest.advanceTimersByTime(15);
      });

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
        jest.advanceTimersByTime(15);
      });

      expect(onUnreadIncrement).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clear pending batch timeout', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
      });

      // Cleanup before timeout fires
      act(() => {
        result.current.cleanup();
      });

      // Advancing time should not process the batch
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();
    });

    test('should also clear message batch on clearLocalMessages', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        result.current.clearLocalMessages();
      });

      // Message batch should be cleared too
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Batches', () => {
    test('should handle multiple sequential batches', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      // First batch
      act(() => {
        result.current.handleNewMessage(createMockMessage('1'));
        jest.advanceTimersByTime(15);
      });

      expect(mockAddMessages).toHaveBeenCalledTimes(1);

      // Second batch
      act(() => {
        result.current.handleNewMessage(createMockMessage('2'));
        jest.advanceTimersByTime(15);
      });

      expect(mockAddMessages).toHaveBeenCalledTimes(2);
    });
  });
});
