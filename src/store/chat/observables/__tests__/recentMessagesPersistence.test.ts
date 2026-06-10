import type { AnyChatMessageType } from '../../types/constants';
import {
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
  clearPersistedRecentMessages,
  deletePersistedRecentMessagesForChannels,
  loadPersistedRecentMessages,
  writePersistedRecentMessagesForChannel,
} from '../recentMessagesPersistence';

// Uses the Map-backed mock at <rootDir>/__mocks__/react-native-mmkv.js, which
// jest applies automatically for node_modules.
const { __resetMMKV } = require('react-native-mmkv');

const makeMessage = (id: string): AnyChatMessageType =>
  ({
    message_id: id,
    message_nonce: `${id}-nonce`,
    sender: 'tester',
    message: [{ type: 'text', content: id }],
    userstate: {},
  }) as unknown as AnyChatMessageType;

beforeEach(() => {
  __resetMMKV();
});

describe('recentMessagesPersistence', () => {
  it('is enabled on native', () => {
    expect(RECENT_MESSAGES_PERSISTENCE_ENABLED).toEqual(true);
  });

  it('round-trips recent messages per channel', () => {
    const channelA = [makeMessage('a1'), makeMessage('a2')];
    const channelB = [makeMessage('b1')];

    writePersistedRecentMessagesForChannel('channel-a', channelA);
    writePersistedRecentMessagesForChannel('channel-b', channelB);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': channelA,
      'channel-b': channelB,
    });
  });

  it('overwrites a channel without touching others', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);

    const nextA = [makeMessage('a2'), makeMessage('a3')];
    writePersistedRecentMessagesForChannel('channel-a', nextA);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': nextA,
      'channel-b': [makeMessage('b1')],
    });
  });

  it('deletes only the given channels', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);
    writePersistedRecentMessagesForChannel('channel-c', [makeMessage('c1')]);

    deletePersistedRecentMessagesForChannels(['channel-a', 'channel-c']);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-b': [makeMessage('b1')],
    });
  });

  it('clears every channel', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);

    clearPersistedRecentMessages();

    expect(loadPersistedRecentMessages()).toEqual({});
  });

  it('drops a channel whose stored value is corrupt', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    // Corrupt the channel-b entry directly via the underlying store.
    const { createMMKV } = require('react-native-mmkv');
    createMMKV({ id: 'chat-recent-messages' }).set('channel-b', '{not json');

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': [makeMessage('a1')],
    });
  });
});
