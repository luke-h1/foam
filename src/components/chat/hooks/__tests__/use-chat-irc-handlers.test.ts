import { act, renderHook } from '@testing-library/react-native';

import { createChatMessage } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { useChatIrcHandlers } from '@app/components/chat/hooks/use-chat-irc-handlers';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { preferences$ } from '@app/store/preference-store';
import { logger } from '@app/utils/logger';

jest.spyOn(logger.chat, 'info').mockImplementation(() => {});
jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});

interface StoredMessageSummary {
  sender: string;
  content: string | undefined;
}

function storedMessages(): StoredMessageSummary[] {
  return chatStore$.messages.peek().map(message => ({
    sender: message.sender,
    content:
      message.message[0] && 'content' in message.message[0]
        ? message.message[0].content
        : undefined,
  }));
}

function addedSystemMessageContents(): (string | undefined)[] {
  return storedMessages()
    .filter(message => message.sender === 'System')
    .map(message => message.content);
}

function seedChatHistory(messageCount: number) {
  addMessages(
    Array.from({ length: messageCount }, (_, index) =>
      createChatMessage({
        overrides: { message_id: `history-${index}`, sender: 'bob' },
        text: `history ${index}`,
      }),
    ),
  );
}

interface RenderIrcHandlersOptions {
  isLoadingRecentMessages?: boolean;
  isMounted?: boolean;
  clearLocalMessages?: jest.Mock;
  enqueueLiveChatMessage?: jest.Mock;
  processMessageEmotes?: jest.Mock;
  moderateChatMessageById?: jest.Mock;
  moderateChatMessagesByLogin?: jest.Mock;
  removeChatMessageById?: jest.Mock;
  removeChatMessagesByLogin?: jest.Mock;
}

function renderIrcHandlers({
  isLoadingRecentMessages = false,
  isMounted = true,
  clearLocalMessages = jest.fn(),
  enqueueLiveChatMessage = jest.fn(),
  processMessageEmotes = jest.fn(),
  moderateChatMessageById = jest.fn(),
  moderateChatMessagesByLogin = jest.fn(),
  removeChatMessageById = jest.fn(),
  removeChatMessagesByLogin = jest.fn(),
}: RenderIrcHandlersOptions = {}) {
  return renderHook(() =>
    useChatIrcHandlers({
      channelId: 'channel-1',
      channelName: 'foam',
      clearLocalMessages,
      enqueueLiveChatMessage,
      handleNewMessage: jest.fn(),
      isMountedRef: { current: isMounted },
      isLoadingRecentMessagesRef: { current: isLoadingRecentMessages },
      removeChatMessagesByLogin,
      listRef: { current: null },
      messages$: chatStore$.messages,
      moderateChatMessageById,
      moderateChatMessagesByLogin,
      processMessageEmotes,
      removeChatMessageById,
    }),
  );
}

describe('useChatIrcHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMessages();
  });

  afterEach(() => {
    preferences$.showJoinPartMessages.set(false);
    preferences$.deletedMessageStyle.set('notice');
  });

  test('skips the connected notice while recent history is loading', () => {
    const { result } = renderIrcHandlers({ isLoadingRecentMessages: true });

    act(() => {
      result.current.onJoin();
    });

    expect(storedMessages()).toEqual([]);
  });

  test('skips the connected notice when history is already visible', () => {
    seedChatHistory(2);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onJoin();
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'bob', content: 'history 0' },
      { sender: 'bob', content: 'history 1' },
    ]);
  });

  test('adds the connected notice when chat starts empty', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onJoin();
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'System', content: "Connected to foam's room" },
    ]);
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

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'System', content: 'baduser has been timed out for 20m' },
    ]);
  });

  test('posts a system message announcing a permanent ban when no duration is given', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser');
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'System', content: 'baduser has been permanently banned' },
    ]);
  });

  test('a targeted CLEARCHAT timeout moderates through the single combined call', () => {
    const moderateChatMessagesByLogin = jest.fn();
    const removeChatMessagesByLogin = jest.fn();

    const { result } = renderIrcHandlers({
      moderateChatMessagesByLogin,
      removeChatMessagesByLogin,
    });

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser', 600);
    });

    expect(moderateChatMessagesByLogin.mock.calls).toEqual([
      ['baduser', 'Timed out (600s)'],
    ]);

    expect(removeChatMessagesByLogin).not.toHaveBeenCalled();
  });

  test('a targeted CLEARCHAT ban moderates with the permanent notice', () => {
    const moderateChatMessagesByLogin = jest.fn();
    const { result } = renderIrcHandlers({ moderateChatMessagesByLogin });

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser');
    });

    expect(moderateChatMessagesByLogin.mock.calls).toEqual([
      ['baduser', 'Permanently banned'],
    ]);
  });

  test('the hidden deleted-message style removes through the single combined call', () => {
    preferences$.deletedMessageStyle.set('hidden');
    const moderateChatMessagesByLogin = jest.fn();
    const removeChatMessagesByLogin = jest.fn();

    const { result } = renderIrcHandlers({
      moderateChatMessagesByLogin,
      removeChatMessagesByLogin,
    });

    act(() => {
      result.current.onClearChat('#foam', {}, 'baduser', 600);
    });

    expect(removeChatMessagesByLogin.mock.calls).toEqual([['baduser']]);
    expect(moderateChatMessagesByLogin).not.toHaveBeenCalled();
  });

  test('CLEARMSG moderates the target through the single combined call', () => {
    const moderateChatMessageById = jest.fn();
    const removeChatMessageById = jest.fn();

    const { result } = renderIrcHandlers({
      moderateChatMessageById,
      removeChatMessageById,
    });

    act(() => {
      result.current.onClearMessage('#foam', { login: 'bob' }, 'msg-1');
    });

    expect(moderateChatMessageById.mock.calls).toEqual([['msg-1', 'Deleted']]);
    expect(removeChatMessageById).not.toHaveBeenCalled();
  });

  test('CLEARMSG removes the target when deleted messages are hidden', () => {
    preferences$.deletedMessageStyle.set('hidden');
    const moderateChatMessageById = jest.fn();
    const removeChatMessageById = jest.fn();

    const { result } = renderIrcHandlers({
      moderateChatMessageById,
      removeChatMessageById,
    });

    act(() => {
      result.current.onClearMessage('#foam', { login: 'bob' }, 'msg-1');
    });

    expect(removeChatMessageById.mock.calls).toEqual([['msg-1']]);
    expect(moderateChatMessageById).not.toHaveBeenCalled();
  });

  test('a full chat clear leaves only the clear notice', () => {
    seedChatHistory(2);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onClearChat('#foam', {});
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'System', content: 'A moderator cleared chat' },
    ]);
  });

  test('does not clear rendered messages when token fires after chat unmounts', () => {
    seedChatHistory(1);
    const clearLocalMessages = jest.fn();

    const { result } = renderIrcHandlers({
      clearLocalMessages,
      isMounted: false,
    });

    act(() => {
      result.current.onPart('#foam');
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'bob', content: 'history 0' },
    ]);

    expect(clearLocalMessages).not.toHaveBeenCalled();
  });

  test('clears rendered messages when token fires while chat is still mounted', () => {
    seedChatHistory(1);
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#foam');
    });

    expect(storedMessages()).toEqual([]);
    expect(clearLocalMessages).toHaveBeenCalledTimes(1);
  });

  test('ignores a stale token for a previously watched channel', () => {
    seedChatHistory(1);
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#previouschannel');
    });

    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'bob', content: 'history 0' },
    ]);

    expect(clearLocalMessages).not.toHaveBeenCalled();
  });

  test('stale token does not reset the room state diff baseline', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    clearMessages();

    act(() => {
      result.current.onPart('#previouschannel');
    });

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    expect(addedSystemMessageContents()).toEqual([]);
  });

  test('matches the parted channel case-insensitively and without the # prefix', () => {
    seedChatHistory(1);
    const clearLocalMessages = jest.fn();
    const { result } = renderIrcHandlers({ clearLocalMessages });

    act(() => {
      result.current.onPart('#FOAM');
    });

    expect(storedMessages()).toEqual([]);
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

    clearMessages();

    act(() => {
      result.current.onRoomState('#foam', { emote_only: '1', slow: '0' });
    });

    expect(addedSystemMessageContents()).toEqual([
      'Emote-only mode enabled',
      'Slow mode disabled',
    ]);
  });

  test('token resets the room state diff baseline', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    act(() => {
      result.current.onPart('#foam');
    });

    clearMessages();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    expect(addedSystemMessageContents()).toEqual([
      'Chat modes active: slow mode (30s)',
    ]);
  });

  test('announces a chatter joining when join/token messages are enabled', () => {
    preferences$.showJoinPartMessages.set(true);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserJoin('#foam', 'bob');
    });

    expect(addedSystemMessageContents()).toEqual(['bob joined']);
  });

  test('announces a chatter parting when join/token messages are enabled', () => {
    preferences$.showJoinPartMessages.set(true);
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserPart('#foam', 'bob');
    });

    expect(addedSystemMessageContents()).toEqual(['bob parted']);
  });

  test('suppresses join/token notices while the preference is off', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onUserJoin('#foam', 'bob');
      result.current.onUserPart('#foam', 'bob');
    });

    expect(storedMessages()).toEqual([]);
  });

  test('a full CLEARCHAT during history replay keeps the backfill', () => {
    seedChatHistory(1);
    const { result } = renderIrcHandlers({ isLoadingRecentMessages: true });

    act(() => {
      result.current.onClearChat('#foam', {});
    });

    // Replay runs through this same handler, so clearing would destroy the
    // history the user is waiting on.
    expect(storedMessages()).toEqual<StoredMessageSummary[]>([
      { sender: 'bob', content: 'history 0' },
      { sender: 'System', content: 'A moderator cleared chat (history kept)' },
    ]);
  });

  test('reconnect resets the room state and announces the reconnect', () => {
    const { result } = renderIrcHandlers();

    act(() => {
      result.current.onRoomState('#foam', { slow: '30' });
    });

    clearMessages();

    act(() => {
      result.current.onReconnect();
    });

    expect(addedSystemMessageContents()).toEqual([
      'Reconnecting to Twitch chat…',
    ]);
  });
});
