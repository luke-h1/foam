import type { ChatMessageType } from '../constants';
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
  updateMessage,
} from '../messages';
import { chatStore$ } from '../state';

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
    chatStore$.persisted.recentMessagesByChannel.set({});
  });

  afterEach(() => {
    jest.useRealTimers();
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.persisted.recentMessagesByChannel.set({});
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

    updateMessage('msg-1', 'nonce-1', {
      message: [{ type: 'text', content: 'updated' }],
    });

    expect(chatStore$.messages.peek()).not.toBe(before);
    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'updated' },
    ]);
  });

  test('addMessages ignores duplicate message keys from historical replay', () => {
    addMessages([
      createMessage('msg-1', 'msg-1', 'historical'),
      createMessage('msg-1', 'msg-1', 'live'),
    ] as ChatMessageType<never>[]);

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
    chatStore$.persisted.recentMessagesByChannel.set({
      'channel-1': [
        undefined,
        { message_id: '', message_nonce: '', message: [] },
        createMessage('msg-1', 'nonce-1', 'first'),
      ] as unknown as ChatMessageType<never>[],
    });

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(1);
    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1']);
  });

  test('restoreRecentMessagesForChannel dedupes persisted entries by id', () => {
    chatStore$.persisted.recentMessagesByChannel.set({
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
    ] as ChatMessageType<never>[]);

    expect(chatStore$.messages.peek()).toHaveLength(2);
    expect(
      chatStore$.persisted.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(1000);

    expect(
      chatStore$.persisted.recentMessagesByChannel
        .peek()
        ['channel-1']?.map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-2']);

    jest.useRealTimers();
  });

  test('updateMessage defers recent-message persistence off the hydration path', () => {
    jest.useFakeTimers();

    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    chatStore$.currentChannelId.set('channel-1');

    updateMessage('msg-1', 'nonce-1', {
      message: [{ type: 'text', content: 'hydrated' }],
    });

    expect(getMessageById('msg-1')?.message).toEqual([
      { type: 'text', content: 'hydrated' },
    ]);
    expect(
      chatStore$.persisted.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(1000);

    expect(
      chatStore$.persisted.recentMessagesByChannel.peek()['channel-1']?.[0]
        ?.message,
    ).toEqual([{ type: 'text', content: 'hydrated' }]);

    jest.useRealTimers();
  });

  test('addMessages indexes new messages without rebuilding the full window', () => {
    const before = chatStore$.messages.peek();

    addMessages([
      createMessage('msg-1', 'nonce-1', 'first'),
      createMessage('msg-2', 'nonce-2', 'second'),
    ] as ChatMessageType<never>[]);

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
      { message_id: '', message_nonce: '', message: [] },
      createMessage('msg-1', 'nonce-1', 'first'),
    ] as unknown as ChatMessageType<never>[]);

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

    updateMessage('msg-1', 'nonce-1', {
      message: [{ type: 'text', content: 'updated' }],
    });

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
});
