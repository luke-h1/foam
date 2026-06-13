import type { AnyChatMessageType } from '../types/constants';
import type { ChatMessageType } from '../types/constants';
import {
  addMessage,
  addMessages,
  clearMessages,
  getMessageById,
  getUserMessageColor,
  moderateMessageById,
  moderateMessagesByLogin,
  removeMessageById,
  restoreRecentMessagesForChannel,
  updateMessages,
  RECENT_MESSAGES_SYNC_DELAY_MS,
} from '../actions/messages';
import { chatStore$ } from '../observables/chatStore';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

function createInvalidStoredMessage(): AnyChatMessageType {
  return {
    ...createMessage('placeholder', 'placeholder', ''),
    message_id: '',
    message_nonce: '',
    message: [],
  };
}

function createSparsePersistedEntries(
  entries: (AnyChatMessageType | undefined)[],
): AnyChatMessageType[] {
  const sparseEntries = [...entries];
  // @ts-expect-error persisted replay can contain sparse historical entries
  return sparseEntries;
}

function createMessage(
  messageId: string,
  messageNonce: string,
  content: string,
): ChatMessageType<never> {
  return {
    id: `${messageId}_${messageNonce}`,
    userstate: {
      username: 'tester',
      login: 'tester',
      'display-name': 'Tester',
      color: '#ff0000',
      'user-id': '1',
      id: messageId,
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
    message: [{ type: 'text', content }],
    badges: [],
    channel: 'test',
    message_id: messageId,
    message_nonce: messageNonce,
    sender: 'tester',
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
}

describe('chatStore messages', () => {
  beforeEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  afterEach(() => {
    jest.useRealTimers();
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  test('removeMessageById removes the targeted message and keeps others', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    addMessage(createMessage('msg-2', 'nonce-2', 'second'));

    removeMessageById('msg-1');

    expect(getMessageById('msg-1')).toBeUndefined();
    expect(getMessageById('msg-2')).toBeDefined();
    expect(chatStore$.messages.peek()).toHaveLength(1);
  });

  test('addMessage publishes a new message array reference', () => {
    const before = chatStore$.messages.peek();

    addMessage(createMessage('msg-1', 'nonce-1', 'first'));

    expect(chatStore$.messages.peek()).not.toBe(before);
    expect(chatStore$.messages.peek()).toHaveLength(1);
  });

  test('updateMessage publishes a new message array reference', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    const before = chatStore$.messages.peek();

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: { message: [{ type: 'text', content: 'updated' }] },
      },
    ]);

    expect(chatStore$.messages.peek()).not.toBe(before);
    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'updated' },
    ]);
  });

  test('addMessages ignores duplicate message keys from historical replay', () => {
    addMessages([
      createMessage('msg-1', 'msg-1', 'historical'),
      createMessage('msg-1', 'msg-1', 'live'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(1);
    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'historical' },
    ]);
  });

  test('moderateMessageById replaces message content with a moderation notice', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'peepoHappy'));

    moderateMessageById('msg-1', 'Deleted');

    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'peepoHappy—Deleted' },
    ]);
    expect(getMessageById('msg-1')?.moderationNotice).toBe('Deleted');
  });

  test('moderateMessagesByLogin replaces all messages for the targeted login', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    addMessage({
      ...createMessage('msg-2', 'nonce-2', 'second'),
      userstate: {
        ...createMessage('msg-2', 'nonce-2', 'second').userstate,
        login: 'other-user',
        username: 'OtherUser',
      },
      sender: 'OtherUser',
    });

    moderateMessagesByLogin('tester', 'Timed out (1s)');

    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'first—Timed out (1s)' },
    ]);
    expect(getMessageById('msg-2')?.message).toEqual([
      { type: 'text', content: 'second' },
    ]);
  });

  test('restoreRecentMessagesForChannel restores cached recent messages for a channel', () => {
    chatStore$.currentChannelId.set('channel-1');
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    addMessage(createMessage('msg-2', 'nonce-2', 'second'));

    clearMessages();

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);
    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-2']);
  });

  test('clearMessages clears sender color indexes', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));

    expect(getUserMessageColor('tester')).toBe('#ff0000');

    clearMessages();

    expect(getUserMessageColor('tester')).toBeUndefined();
  });

  test('restoreRecentMessagesForChannel skips sparse persisted entries', () => {
    chatStore$.recentMessagesByChannel.set({
      'channel-1': createSparsePersistedEntries([
        undefined,
        createInvalidStoredMessage(),
        createMessage('msg-1', 'nonce-1', 'first'),
      ]),
    });

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(1);
    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1']);
  });

  test('restoreRecentMessagesForChannel dedupes persisted entries by id', () => {
    chatStore$.recentMessagesByChannel.set({
      'channel-1': [
        createMessage('msg-1', 'msg-1', 'first'),
        createMessage('msg-1', 'msg-1', 'duplicate key'),
        {
          ...createMessage('msg-2', 'msg-2', 'duplicate id'),
          id: 'msg-1_msg-1',
        },
        createMessage('msg-3', 'msg-3', 'third'),
      ],
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);
    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-3']);
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Multiple elements in array have the same ID'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });

  test('normalises stored message id to the chat message key', () => {
    addMessage({
      ...createMessage('msg-1', 'nonce-1', 'first'),
      id: 'duplicate-id-from-source',
    });

    expect(chatStore$.messages.peek()[0]?.id).toBe('msg-1_nonce-1');
  });

  test('addMessages defers recent-message persistence off the live chat path', () => {
    jest.useFakeTimers();
    chatStore$.currentChannelId.set('channel-1');

    addMessages([
      createMessage('msg-1', 'nonce-1', 'first'),
      createMessage('msg-2', 'nonce-2', 'second'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(2);
    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(RECENT_MESSAGES_SYNC_DELAY_MS);

    expect(
      chatStore$.recentMessagesByChannel
        .peek()
        ['channel-1']?.map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-2']);

    jest.useRealTimers();
  });

  test('updateMessage defers recent-message persistence off the hydration path', () => {
    jest.useFakeTimers();

    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    chatStore$.currentChannelId.set('channel-1');

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: {
          message: [{ type: 'text', content: 'hydrated' }],
        },
      },
    ]);

    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'hydrated' },
    ]);
    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(RECENT_MESSAGES_SYNC_DELAY_MS);

    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1']?.[0]?.message,
    ).toEqual([{ type: 'text', content: 'hydrated' }]);

    jest.useRealTimers();
  });

  test('addMessages indexes new messages without rebuilding the full window', () => {
    const before = chatStore$.messages.peek();

    addMessages([
      createMessage('msg-1', 'nonce-1', 'first'),
      createMessage('msg-2', 'nonce-2', 'second'),
    ]);

    expect(chatStore$.messages.peek()).not.toBe(before);
    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'first' },
    ]);
    expect(getMessageById('msg-2')?.message).toEqual([
      { type: 'text', content: 'second' },
    ]);
  });

  test('addMessages skips sparse or incomplete entries', () => {
    addMessages([
      undefined,
      createInvalidStoredMessage(),
      createMessage('msg-1', 'nonce-1', 'first'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(1);
    expect(chatStore$.messages.peek()[0]?.message_id).toBe('msg-1');
  });

  test('message part arrays do not warn when mixed emote and text parts are updated', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const message = createMessage('msg-1', 'nonce-1', 'first');

    addMessage({
      ...message,
      message: [
        {
          type: 'emote',
          content: 'WW',
          id: '01F71VQYHR000D3ZZ6Q11NR7TV',
          name: 'WW',
          url: 'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x.avif',
        },
        { type: 'text', content: ' ' },
        { type: 'text', content: 'HillaryClintonsEmails_' },
      ],
    });

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: { message: [{ type: 'text', content: 'updated' }] },
      },
    ]);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Multiple elements in array have the same ID'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });

  test('addMessages keeps the in-memory chat window bounded', () => {
    addMessages(
      Array.from({ length: 650 }, (_, index) =>
        createMessage(`msg-${index}`, `nonce-${index}`, `${index}`),
      ),
    );

    const messages = chatStore$.messages.peek();

    expect(messages).toHaveLength(600);
    expect(messages[0]?.message_id).toBe('msg-50');
    expect(messages.at(-1)?.message_id).toBe('msg-649');
    expect(getMessageById('msg-0')).toBeUndefined();
    expect(getMessageById('msg-649')?.message).toEqual([
      { type: 'text', content: '649' },
    ]);
  });

  test('surviving messages stay addressable after later flushes trim the window', () => {
    addMessages(
      Array.from({ length: 600 }, (_, index) =>
        createMessage(`msg-${index}`, `nonce-${index}`, `${index}`),
      ),
    );

    // A follow-up flush on a full window front-trims the survivors, whose
    // indexes were recorded before the trim and must shift with it.
    addMessages(
      Array.from({ length: 10 }, (_, index) =>
        createMessage(`msg-${600 + index}`, `nonce-${600 + index}`, 'late'),
      ),
    );

    const messages = chatStore$.messages.peek();
    expect(messages).toHaveLength(600);
    expect(messages[0]?.message_id).toBe('msg-10');
    expect(getMessageById('msg-9')).toBeUndefined();
    expect(getMessageById('msg-300')?.message).toEqual([
      { type: 'text', content: '300' },
    ]);

    moderateMessageById('msg-300', 'Timed out (10s)');

    expect(getMessageById('msg-300')?.moderationNotice).toBe('Timed out (10s)');
    expect(getMessageById('msg-300')?.message).toEqual([
      { type: 'text', content: '300—Timed out (10s)' },
    ]);
    expect(getMessageById('msg-299')?.moderationNotice).toBeUndefined();
    expect(getMessageById('msg-301')?.moderationNotice).toBeUndefined();
  });
});
