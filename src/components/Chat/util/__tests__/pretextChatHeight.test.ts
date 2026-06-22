import type { AnyChatMessageType } from '../messageHandlers';
import { estimateChatMessageHeightWithPretext } from '../pretextChatHeight';
import { createChatMessageFixture } from './__fixtures__/chatMessage.fixture';

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

  test('reply context adds a single line regardless of reply body length', () => {
    const makeOptions = {
      containerWidth: 320,
      density: 'comfortable',
      showInlineReplyContext: true,
      showTimestamp: false,
    } as const;
    const shortReplyHeight = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-reply-short',
        parentDisplayName: 'originalUser',
        replyBody: 'ok',
      }),
      makeOptions,
    );
    const longReplyHeight = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-reply-long',
        parentDisplayName: 'originalUser',
        replyBody:
          'a very long reply body that would wrap onto many lines if it were not clamped to a single line by the renderer'.repeat(
            3,
          ),
      }),
      makeOptions,
    );

    // ReplyingToHeader renders numberOfLines={1}, so the estimate must not
    // grow with the reply body.
    expect(longReplyHeight).toEqual(shortReplyHeight);
  });

  test('larger chat font scale produces taller estimates for wrapped text', () => {
    const longText =
      'this message definitely wraps onto several lines at this width '.repeat(
        3,
      );
    const makeMessage = (id: string) =>
      createMessage({ id, message: [{ type: 'text', content: longText }] });
    const defaultHeight = estimateChatMessageHeightWithPretext(
      makeMessage('msg-scale-default'),
      {
        containerWidth: 320,
        density: 'comfortable',
        showInlineReplyContext: false,
        showTimestamp: false,
      },
    );
    const largeHeight = estimateChatMessageHeightWithPretext(
      makeMessage('msg-scale-large'),
      {
        containerWidth: 320,
        density: 'comfortable',
        fontScale: 'large',
        showInlineReplyContext: false,
        showTimestamp: false,
      },
    );

    expect(largeHeight ?? 0).toBeGreaterThan(defaultHeight ?? 0);
  });

  test('measures inline emote messages at the emote line height', () => {
    const longText =
      'this message definitely wraps onto several lines at this width ';
    const textOnlyHeight = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-text-only',
        message: [{ type: 'text', content: longText.repeat(2) }],
      }),
      {
        containerWidth: 320,
        density: 'comfortable',
        showInlineReplyContext: false,
        showTimestamp: false,
      },
    );
    const emoteHeight = estimateChatMessageHeightWithPretext(
      createMessage({
        id: 'msg-text-emote',
        message: [
          { type: 'text', content: longText.repeat(2) },
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
        density: 'comfortable',
        showInlineReplyContext: false,
        showTimestamp: false,
      },
    );

    /**
     * Same wrapped text, but the emote forces the whole Text onto the
     * taller emote lineHeight (34 vs 17 per line), so the estimate must
     * grow far beyond just the appended emote width.
     */
    expect(emoteHeight).toBeGreaterThan((textOnlyHeight ?? 0) * 1.5);
  });
});
