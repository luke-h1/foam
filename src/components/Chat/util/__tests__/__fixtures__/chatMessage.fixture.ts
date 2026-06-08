import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { AnyChatMessageType } from '../../messageHandlers';

export function createChatMessageFixture(
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return {
    id: 'msg-1_nonce-1',
    message_id: 'msg-1',
    message_nonce: 'nonce-1',
    sender: 'sender',
    channel: 'channel',
    badges: [],
    cachedSenderColor: '#fff',
    message: [{ type: 'text', content: 'hello chat' }],
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    timestamp: '12:00',
    userstate: {
      username: 'sender',
      login: 'sender',
      color: '#fff',
      'display-name': 'sender',
      'user-id': 'sender-id',
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      id: 'msg-1',
    } as UserStateTags,
    ...overrides,
  } as AnyChatMessageType;
}
