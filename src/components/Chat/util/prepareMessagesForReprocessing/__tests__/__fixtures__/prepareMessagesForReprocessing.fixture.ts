import { AnyChatMessageType } from '@app/components/Chat/util/messageHandlers';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import { createTextPart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

export const createMockUserstate = (
  displayName = 'TestUser',
): AnyChatMessageType['userstate'] =>
  createUserStateTags({
    'display-name': displayName,
    login: displayName.toLowerCase(),
    username: displayName,
    'user-id': '123456',
    id: 'msg-123',
    color: '#FF0000',
  });

export const createMockMessage = (
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType => ({
  id: 'msg-123_nonce-123',
  message_id: 'msg-123',
  message_nonce: 'nonce-123',
  message: [createTextPart('Hello world')],
  channel: 'testchannel',
  sender: 'TestUser',
  badges: [],
  userstate: createMockUserstate(),
  parentDisplayName: '',
  replyDisplayName: '',
  replyBody: '',
  ...overrides,
});

export const createSystemMessage = (): AnyChatMessageType =>
  createMockMessage({
    sender: 'System',
    message: [createTextPart('System message')],
    userstate: {
      ...createMockUserstate('System'),
      login: 'system',
    },
  });

export const createNoticeMessage = (): AnyChatMessageType => ({
  ...createMockMessage(),
  notice_tags: {
    'msg-id': 'sub',
    'msg-param-sub-plan': '1000',
    'msg-param-cumulative-months': '1',
    'msg-param-should-share-streak': '0',
    'msg-param-streak-months': '1',
    'msg-param-sub-plan-name': 'Tier 1',
  },
  sender: 'SubUser',
});
