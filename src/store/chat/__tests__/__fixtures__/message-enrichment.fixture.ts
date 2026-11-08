import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

export const createSystemMessage = (): AnyChatMessageType =>
  createChatMessageFixture({
    sender: 'System',
    message: [createTextToken('System message')],
    userstate: createUserStateTags({
      'display-name': 'System',
      login: 'system',
      username: 'System',
    }),
  });

export const createNoticeMessage = (): AnyChatMessageType => ({
  ...createChatMessageFixture(),
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
