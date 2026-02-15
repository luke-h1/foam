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
      expect(typeof result.current.forceFlush).toBe('function');
      expect(typeof result.current.getBufferSize).toBe('function');
    });

    test('should start with empty buffer', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      expect(result.current.getBufferSize()).toBe(0);
    });
  });

  describe('Message Buffering', () => {
    test('should buffer messages and flush periodically', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      const message = createMockMessage('1');

      act(() => {
        result.current.handleNewMessage(message);
      });

      expect(mockAddMessages).not.toHaveBeenCalled();
      expect(result.current.getBufferSize()).toBe(1);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockAddMessages).toHaveBeenCalledWith([
        expect.objectContaining({
          message_id: '1',
          message_nonce: 'nonce-1',
        }),
      ]);
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
        jest.advanceTimersByTime(100);
      });

      expect(mockAddMessages).toHaveBeenCalled();
      expect(result.current.getBufferSize()).toBe(0);
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

      expect(mockAddMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message_id: '1' }),
          expect.objectContaining({ message_id: '2' }),
          expect.objectContaining({ message_id: '3' }),
        ]),
      );
      expect(result.current.getBufferSize()).toBe(0);
    });
  });

  describe('Unread Count', () => {
    test('should increment unread for each message when not at bottom', () => {
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

      expect(onUnreadIncrement).toHaveBeenCalledTimes(2);
      expect(onUnreadIncrement).toHaveBeenCalledWith(1);
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
    test('should flush entire buffer so all messages appear', () => {
      const { result } = renderHook(() => useChatMessages(defaultOptions));

      act(() => {
        for (let i = 0; i < 250; i += 1) {
          result.current.handleNewMessage(createMockMessage(`${i}`));
        }
      });

      expect(result.current.getBufferSize()).toBe(250);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockAddMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message_id: '0' }),
          expect.objectContaining({ message_id: '249' }),
        ]),
      );
      expect(mockAddMessages).toHaveBeenCalledTimes(1);
      const firstCall = (mockAddMessages as jest.Mock).mock
        .calls[0] as unknown[];
      expect(firstCall[0]).toHaveLength(250);
      expect(result.current.getBufferSize()).toBe(0);
    });
  });
});
