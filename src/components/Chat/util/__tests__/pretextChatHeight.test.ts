import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { AnyChatMessageType } from '../messageHandlers';
import { estimateChatMessageHeightWithPretext } from '../pretextChatHeight';

function createMessage(
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

describe('estimateChatMessageHeightWithPretext', () => {
  test('estimates image emote rows instead of falling back', () => {
    const height = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-emote',
        message: [
          { type: 'text', content: 'classic ' },
          {
            type: 'emote',
            content: 'WW',
            id: 'emote-1',
            name: 'WW',
            width: 128,
            height: 128,
            aspect_ratio: 1,
            zero_width: false,
          },
        ],
      }),
      {
        containerWidth: 320,
        density: 'compact',
        showTimestamp: true,
      },
    );

    expect(height).toBeGreaterThanOrEqual(32);
  });

  test('adds space for inline reply context rows', () => {
    const plainHeight = estimateChatMessageHeightWithPretext(createMessage(), {
      containerWidth: 320,
      density: 'compact',
      showTimestamp: true,
    });
    const replyHeight = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-reply',
        parentDisplayName: 'originalUser',
        replyBody: 'original message',
      }),
      {
        containerWidth: 320,
        density: 'compact',
        showTimestamp: true,
      },
    );

    expect(replyHeight).toBeGreaterThan(plainHeight ?? 0);
  });
});
