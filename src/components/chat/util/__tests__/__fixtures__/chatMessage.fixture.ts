import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

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
    message: [createTextToken('hello chat')],
    replyBody: '',
    replyParentLogin: '',
    parentDisplayName: '',
    timestamp: '12:00',
    userstate: createUserStateTags({
      username: 'sender',
      login: 'sender',
      color: '#fff',
      'display-name': 'sender',
      'user-id': 'sender-id',
      id: 'msg-1',
    }),
    ...overrides,
  };
}
