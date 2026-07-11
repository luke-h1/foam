import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createTextPart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import {
  clearPersistedRecentMessages,
  deletePersistedRecentMessagesForChannels,
  loadPersistedRecentMessages,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
  writePersistedRecentMessagesForChannel,
} from '../recentMessagesPersistence';

const { __resetMMKV } = require('react-native-mmkv');

const makeMessage = (id: string): AnyChatMessageType =>
  createChatMessageFixture({
    id: `${id}_${id}-nonce`,
    message_id: id,
    message_nonce: `${id}-nonce`,
    message: [createTextPart(id)],
  });

beforeEach(() => {
  __resetMMKV();
});

describe('recentMessagesPersistence', () => {
  test('is enabled on native', () => {
    expect(RECENT_MESSAGES_PERSISTENCE_ENABLED).toEqual(true);
  });

  test('round-trips recent messages per channel', () => {
    const channelA = [makeMessage('a1'), makeMessage('a2')];
    const channelB = [makeMessage('b1')];

    writePersistedRecentMessagesForChannel('channel-a', channelA);
    writePersistedRecentMessagesForChannel('channel-b', channelB);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': channelA,
      'channel-b': channelB,
    });
  });

  test('overwrites a channel without touching others', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);

    const nextA = [makeMessage('a2'), makeMessage('a3')];
    writePersistedRecentMessagesForChannel('channel-a', nextA);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': nextA,
      'channel-b': [makeMessage('b1')],
    });
  });

  test('deletes only the given channels', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);
    writePersistedRecentMessagesForChannel('channel-c', [makeMessage('c1')]);

    deletePersistedRecentMessagesForChannels(['channel-a', 'channel-c']);

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-b': [makeMessage('b1')],
    });
  });

  test('clears every channel', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    writePersistedRecentMessagesForChannel('channel-b', [makeMessage('b1')]);

    clearPersistedRecentMessages();

    expect(loadPersistedRecentMessages()).toEqual({});
  });

  test('drops a channel whose stored value is corrupt', () => {
    writePersistedRecentMessagesForChannel('channel-a', [makeMessage('a1')]);
    const { createMMKV } = require('react-native-mmkv');
    createMMKV({ id: 'chat-recent-messages' }).set('channel-b', '{not json');

    expect(loadPersistedRecentMessages()).toEqual({
      'channel-a': [makeMessage('a1')],
    });
  });
});
