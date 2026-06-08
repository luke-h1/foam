import { createChatMessageFixture } from './__fixtures__/chatMessage.fixture';
import type { AnyChatMessageType } from '../messageHandlers';
import { estimateChatMessageHeightWithPretext } from '../pretextChatHeight';

function createMessage(
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return createChatMessageFixture(overrides);
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
        showInlineReplyContext: true,
        showTimestamp: true,
      },
    );

    expect(height).toBeGreaterThanOrEqual(32);
  });

  test('adds space for inline reply context rows', () => {
    const plainHeight = estimateChatMessageHeightWithPretext(createMessage(), {
      containerWidth: 320,
      density: 'compact',
      showInlineReplyContext: true,
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
        showInlineReplyContext: true,
        showTimestamp: true,
      },
    );

    expect(replyHeight).toBeGreaterThan(plainHeight ?? 0);
  });
});
