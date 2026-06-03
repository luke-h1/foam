import { addMessage } from '@app/store/chatStore/messages';
import { renderHook, act } from '@testing-library/react-native';
import { useChatIrcHandlers } from '../useChatIrcHandlers';

jest.mock('@app/store/chatStore/messages', () => ({
  addMessage: jest.fn(),
  clearMessages: jest.fn(),
  getMessageById: jest.fn(),
  getMessageColor: jest.fn(),
  moderateMessageById: jest.fn(),
  moderateMessagesByLogin: jest.fn(),
  removeMessageById: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const mockAddMessage = jest.mocked(addMessage);

function renderIrcHandlers({
  isLoadingRecentMessages = false,
  messageCount = 0,
}: {
  isLoadingRecentMessages?: boolean;
  messageCount?: number;
} = {}) {
  return renderHook(() =>
    useChatIrcHandlers({
      channelId: 'channel-1',
      channelName: 'foam',
      clearLocalMessages: jest.fn(),
      handleNewMessage: jest.fn(),
      isLoadingRecentMessagesRef: { current: isLoadingRecentMessages },
      listRef: { current: null },
      messages$: {
        peek: jest.fn(() => Array.from({ length: messageCount })),
      },
      moderateBufferedMessageById: jest.fn(),
      moderateBufferedMessagesByLogin: jest.fn(),
      processMessageEmotes: jest.fn(),
      removeBufferedMessageById: jest.fn(),
    }),
  );
}

describe('useChatIrcHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('skips the connected notice while recent history is loading', () => {
    const { result } = renderIrcHandlers({ isLoadingRecentMessages: true });

    act(() => {
      result.current.onJoin();
    });

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  test('skips the connected notice when history is already visible', () => {
    const { result } = renderIrcHandlers({ messageCount: 12 });

    act(() => {
      result.current.onJoin();
    });

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  test('adds the connected notice when chat starts empty', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onJoin();
    });

    expect(mockAddMessage).toHaveBeenCalledTimes(1);
    const message = mockAddMessage.mock.calls[0]?.[0];
    expect({
      content:
        message?.message[0] && 'content' in message.message[0]
          ? message.message[0].content
          : undefined,
      sender: message?.sender,
    }).toEqual({
      content: "Connected to foam's room",
      sender: 'System',
    });
  });
});
