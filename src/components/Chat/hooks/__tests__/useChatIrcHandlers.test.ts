import { act, renderHook } from '@testing-library/react-native';

import {
  addMessage,
  clearMessages,
  clearMessagesWithNotice,
} from '@app/store/chat/actions/messages';
import { preferences$ } from '@app/store/preferenceStore';

import { useChatIrcHandlers } from '../useChatIrcHandlers';

jest.mock('@app/store/chat/actions/messages', () => ({
  addMessage: jest.fn(),
  clearMessages: jest.fn(),
  clearMessagesWithNotice: jest.fn(),
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
const mockClearMessagesWithNotice = jest.mocked(clearMessagesWithNotice);

function addedSystemMessageContents(): (string | undefined)[] {
  return mockAddMessage.mock.calls.map(([message]) =>
    message?.message[0] && 'content' in message.message[0]
      ? message.message[0].content
      : undefined,
  );
}

function renderIrcHandlers({
  isLoadingRecentMessages = false,
  isMounted = true,
  messageCount = 0,
  clearLocalMessages = jest.fn(),
  enqueueLiveChatMessage = jest.fn(),
  processMessageEmotes = jest.fn(),
}: {
  isLoadingRecentMessages?: boolean;
  isMounted?: boolean;
  messageCount?: number;
  clearLocalMessages?: jest.Mock;
  enqueueLiveChatMessage?: jest.Mock;
  processMessageEmotes?: jest.Mock;
} = {}) {
  return renderHook(() =>
    useChatIrcHandlers({
      channelId: 'channel-1',
      channelName: 'foam',
      clearLocalMessages,
      enqueueLiveChatMessage,
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

  afterEach(() => {
    preferences$.showJoinPartMessages.set(false);
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
    const enqueueLiveChatMessage = jest.fn();
    const { result } = renderIrcHandlers({ enqueueLiveChatMessage });

    act(() => {
      result.current.onMessage(
        '#foam',
        { 'display-name': 'Bob', login: 'bob', color: '#FF0000' },
        `${String.fromCharCode(1)}ACTION waves at chat${String.fromCharCode(1)}`,
      );
    });

    expect(enqueueLiveChatMessage).toHaveBeenCalledTimes(1);
    const [baseMessage] = enqueueLiveChatMessage.mock.calls[0] ?? [];
    expect(baseMessage.isAction).toEqual(true);
    expect(baseMessage.message[0].content).toEqual('waves at chat');
  });

  test('does not flag a normal message as an action', () => {
    const enqueueLiveChatMessage = jest.fn();
    const { result } = renderIrcHandlers({ enqueueLiveChatMessage });

    act(() => {
      result.current.onMessage(
        '#foam',
        { 'display-name': 'Bob', login: 'bob' },
        'hello world',
      );
    });

    const [baseMessage] = enqueueLiveChatMessage.mock.calls[0] ?? [];
    expect(baseMessage.message[0].content).toEqual('hello world');
    expect(baseMessage.isAction).toBeUndefined();
  });

  test('live messages defer the emote parse; replay parses eagerly', () => {
    const enqueueLiveChatMessage = jest.fn();
    const processMessageEmotes = jest.fn();
    const { result } = renderIrcHandlers({
      enqueueLiveChatMessage,
      processMessageEmotes,
    });

    act(() => {
      result.current.onMessage(
        '#foam',
        { 'display-name': 'Bob', login: 'bob' },
        'live message',
      );
    });

    expect(enqueueLiveChatMessage).toHaveBeenCalledTimes(1);
    expect(enqueueLiveChatMessage.mock.calls[0]?.[1]).toEqual(true);
    expect(processMessageEmotes).not.toHaveBeenCalled();
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

    expect(mockAddMessage).not.toHaveBeenCalled();
    const notice = mockClearMessagesWithNotice.mock.calls[0]?.[0];
    const content =
      notice?.message[0] && 'content' in notice.message[0]
        ? notice.message[0].content
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
      result.current.onPart('#foam');
    });

    expect(mockClearMessages).not.toHaveBeenCalled();
    expect(clearLocalMessages).not.toHaveBeenCalled();
  });

  test('clears rendered messages when part fires while chat is still mounted', () => {
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#foam');
    });

    expect(mockClearMessages).toHaveBeenCalledTimes(1);
    expect(clearLocalMessages).toHaveBeenCalledTimes(1);
  });

  test('ignores a stale part for a previously watched channel', () => {
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#previouschannel');
    });

    expect(mockClearMessages).not.toHaveBeenCalled();
    expect(clearLocalMessages).not.toHaveBeenCalled();
  });

  test('stale part does not reset the room state diff baseline', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });
    mockAddMessage.mockClear();

    act(() => {
      result.current.onPart('#previouschannel');
    });

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    expect(addedSystemMessageContents()).toEqual([]);
  });

  test('matches the parted channel case-insensitively and without the # prefix', () => {
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#FOAM');
    });

    expect(mockClearMessages).toHaveBeenCalledTimes(1);
    expect(clearLocalMessages).toHaveBeenCalledTimes(1);
  });

  test('summarises modes on the first ROOMSTATE', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', {
        'followers-only': '10',
        slow: '30',
      });
    });

    expect(addedSystemMessageContents()).toEqual([
      'Chat modes active: slow mode (30s), followers-only (10m)',
    ]);
  });

  test('announces only the delta on subsequent ROOMSTATE updates', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });
    mockAddMessage.mockClear();

    act(() => {
      result.current.onRoomState('#foam', { emote_only: '1', slow: '0' });
    });

    expect(addedSystemMessageContents()).toEqual([
      'Emote-only mode enabled',
      'Slow mode disabled',
    ]);
  });

  test('part resets the room state diff baseline', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    act(() => {
      result.current.onPart('#foam');
    });

    mockAddMessage.mockClear();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    expect(addedSystemMessageContents()).toEqual([
      'Chat modes active: slow mode (30s)',
    ]);
  });

  test('announces a chatter joining when join/part messages are enabled', () => {
    preferences$.showJoinPartMessages.set(true);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserJoin('#foam', 'bob');
    });

    expect(addedSystemMessageContents()).toEqual(['bob joined']);
  });

  test('announces a chatter parting when join/part messages are enabled', () => {
    preferences$.showJoinPartMessages.set(true);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserPart('#foam', 'bob');
    });

    expect(addedSystemMessageContents()).toEqual(['bob parted']);
  });

  test('suppresses join/part notices while the preference is off', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserJoin('#foam', 'bob');
      result.current.onUserPart('#foam', 'bob');
    });

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  test('reconnect resets the room state and announces the reconnect', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });
    mockAddMessage.mockClear();

    act(() => {
      result.current.onReconnect();
    });

    expect(addedSystemMessageContents()).toEqual([
      'Reconnecting to Twitch chat…',
    ]);
  });
});
