import type { ChatMessageType } from '../constants';
import {
  addMessage,
  clearMessages,
  getMessageById,
  moderateMessageById,
  moderateMessagesByLogin,
  removeMessageById,
  restoreRecentMessagesForChannel,
} from '../messages';
import { chatStore$ } from '../state';

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
): ChatMessageType<'usernotice'> {
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
});
