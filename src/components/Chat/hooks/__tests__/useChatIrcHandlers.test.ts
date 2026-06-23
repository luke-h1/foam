import { act, renderHook } from '@testing-library/react-native';

import { addMessage, clearMessages } from '@app/store/chat/actions/messages';

import { useChatIrcHandlers } from '../useChatIrcHandlers';

jest.mock('@app/store/chat/actions/messages', () => ({
  addMessage: jest.fn(),
  clearMessages: jest.fn(),
  getMessageById: jest.fn(),
  getMessageColor: jest.fn(),
  moderateMessageById: jest.fn(),
  moderateMessagesByLogin: jest.fn(),
  removeMessageById: jest.fn(),
  removeMessagesByLogin: jest.fn(),
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
const mockClearMessages = jest.mocked(clearMessages);

function renderIrcHandlers({
  isLoadingRecentMessages = false,
  isMounted = true,
  messageCount = 0,
  clearLocalMessages = jest.fn(),
  processMessageEmotes = jest.fn(),
}: {
  isLoadingRecentMessages?: boolean;
  isMounted?: boolean;
  messageCount?: number;
  clearLocalMessages?: jest.Mock;
  processMessageEmotes?: jest.Mock;
} = {}) {
  return renderHook(() =>
    useChatIrcHandlers({
      channelId: 'channel-1',
      channelName: 'foam',
      clearLocalMessages,
      handleNewMessage: jest.fn(),
      isMountedRef: { current: isMounted },
      isLoadingRecentMessagesRef: { current: isLoadingRecentMessages },
      removeBufferedMessagesByLogin: jest.fn(),
      listRef: { current: null },
      messages$: {
        peek: jest.fn(() => Array.from({ length: messageCount })),
      },
      moderateBufferedMessageById: jest.fn(),
      moderateBufferedMessagesByLogin: jest.fn(),
      processMessageEmotes,
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

  test('strips the CTCP ACTION wrapper and flags /me messages', () => {
    const processMessageEmotes = jest.fn();
    const { result } = renderIrcHandlers({ processMessageEmotes });

    act(() => {
      result.current.onMessage(
        '#foam',
        { 'display-name': 'Bob', login: 'bob', color: '#FF0000' },
        `${String.fromCharCode(1)}ACTION waves at chat${String.fromCharCode(1)}`,
      );
    });

    expect(processMessageEmotes).toHaveBeenCalledTimes(1);
    const [text, , baseMessage] = processMessageEmotes.mock.calls[0] ?? [];
    expect(text).toEqual('waves at chat');
    expect(baseMessage.isAction).toEqual(true);
    expect(baseMessage.message[0].content).toEqual('waves at chat');
  });

  test('does not flag a normal message as an action', () => {
    const processMessageEmotes = jest.fn();
    const { result } = renderIrcHandlers({ processMessageEmotes });

    act(() => {
      result.current.onMessage(
        '#foam',
        { 'display-name': 'Bob', login: 'bob' },
        'hello world',
      );
    });

    const [text, , baseMessage] = processMessageEmotes.mock.calls[0] ?? [];
    expect(text).toEqual('hello world');
    expect(baseMessage.isAction).toBeUndefined();
  });

  test('posts a system message announcing a timeout with a humanised duration', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser', 1200);
    });

    const message = mockAddMessage.mock.calls[0]?.[0];
    expect({
      content:
        message?.message[0] && 'content' in message.message[0]
          ? message.message[0].content
          : undefined,
      sender: message?.sender,
    }).toEqual({
      content: 'baduser has been timed out for 20m',
      sender: 'System',
    });
  });

  test('posts a system message announcing a permanent ban when no duration is given', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser');
    });

    const message = mockAddMessage.mock.calls[0]?.[0];
    const content =
      message?.message[0] && 'content' in message.message[0]
        ? message.message[0].content
        : undefined;
    expect(content).toEqual('baduser has been permanently banned');
  });

  test('does not announce a per-user action on a full chat clear', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onClearChat('#foam', {});
    });

    const message = mockAddMessage.mock.calls[0]?.[0];
    const content =
      message?.message[0] && 'content' in message.message[0]
        ? message.message[0].content
        : undefined;
    expect(content).toEqual('Chat was cleared by a moderator');
  });

  test('does not clear rendered messages when part fires after chat unmounts', () => {
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({
      clearLocalMessages,
      isMounted: false,
    });

    act(() => {
      result.current.onPart();
    });

    expect(mockClearMessages).not.toHaveBeenCalled();
    expect(clearLocalMessages).not.toHaveBeenCalled();
  });

  test('clears rendered messages when part fires while chat is still mounted', () => {
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart();
    });

    expect(mockClearMessages).toHaveBeenCalledTimes(1);
    expect(clearLocalMessages).toHaveBeenCalledTimes(1);
  });
});
