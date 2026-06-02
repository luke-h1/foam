import type { AnyChatMessageType } from '../messageHandlers';

const mockMeasureInlineFlow = jest.fn(
  (_prepared: unknown, _maxWidth: number, lineHeight: number) => ({
    height: lineHeight,
    lineCount: 1,
  }),
);
const mockPrepareInlineFlow = jest.fn((items: unknown[]) => items);

jest.mock('../expoPretext', () => ({
  measureInlineFlow: mockMeasureInlineFlow,
  prepareInlineFlow: mockPrepareInlineFlow,
}));

const { estimateChatMessageHeightWithPretext } =
  require('../pretextChatHeight') as typeof import('../pretextChatHeight');

function createMessage(
  message: AnyChatMessageType['message'],
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return {
    id: 'message-1',
    userstate: {
      'reply-parent-display-name': '',
      'reply-parent-msg-body': '',
      'reply-parent-msg-id': '',
      'reply-parent-user-login': '',
      username: 'luke',
    },
    message,
    badges: [],
    channel: 'channel',
    message_id: 'message-1',
    message_nonce: 'nonce-1',
    replyBody: '',
    replyDisplayName: '',
    sender: 'luke',
    timestamp: '12:00',
    ...overrides,
  };
}

describe('estimateChatMessageHeightWithPretext', () => {
  beforeEach(() => {
    mockMeasureInlineFlow.mockClear();
    mockPrepareInlineFlow.mockClear();
  });

  test('reserves rendered emote height before image assets load', () => {
    const height = estimateChatMessageHeightWithPretext(
      createMessage([
        { type: 'text', content: 'hello ' },
        {
          type: 'emote',
          content: 'Kappa',
          name: 'Kappa',
          width: 112,
          height: 64,
        },
      ]),
      {
        containerWidth: 390,
        density: 'comfortable',
        showTimestamp: true,
      },
    );

    expect(height).toBe(28);
    expect(mockPrepareInlineFlow).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          atomic: true,
          extraWidth: 46,
        }),
      ]),
    );
  });

  test('keeps zero-width emotes from adding inline width', () => {
    estimateChatMessageHeightWithPretext(
      createMessage([
        {
          type: 'emote',
          content: 'base',
          name: 'base',
          width: 64,
          height: 64,
        },
        {
          type: 'emote',
          content: 'overlay',
          name: 'overlay',
          width: 64,
          height: 64,
          zero_width: true,
        },
      ]),
      {
        containerWidth: 390,
        density: 'compact',
        showTimestamp: false,
      },
    );

    const items = mockPrepareInlineFlow.mock.calls.at(-1)?.[0] as unknown[];
    expect(
      items.filter(
        item =>
          typeof item === 'object' && item !== null && 'extraWidth' in item,
      ),
    ).toHaveLength(1);
  });

  test('re-estimates when an existing text message is hydrated into an emote', () => {
    const baseOptions = {
      containerWidth: 390,
      density: 'comfortable' as const,
      showTimestamp: false,
    };

    const textHeight = estimateChatMessageHeightWithPretext(
      createMessage([{ type: 'text', content: 'Kappa' }], {
        id: 'hydrating-emote-message',
      }),
      baseOptions,
    );
    const emoteHeight = estimateChatMessageHeightWithPretext(
      createMessage(
        [
          {
            type: 'emote',
            content: 'Kappa',
            name: 'Kappa',
            width: 64,
            height: 64,
          },
        ],
        {
          id: 'hydrating-emote-message',
        },
      ),
      baseOptions,
    );

    expect(textHeight).toBe(19);
    expect(emoteHeight).toBe(28);
  });

  test('re-estimates when badges are hydrated onto an existing message', () => {
    const baseOptions = {
      containerWidth: 390,
      density: 'comfortable' as const,
      showTimestamp: false,
    };

    const withoutBadgeHeight = estimateChatMessageHeightWithPretext(
      createMessage([{ type: 'text', content: 'hello' }], {
        id: 'hydrating-badge-message',
      }),
      baseOptions,
    );
    const withBadgeHeight = estimateChatMessageHeightWithPretext(
      createMessage([{ type: 'text', content: 'hello' }], {
        badges: [
          {
            id: '1',
            set: 'subscriber',
            title: 'Subscriber',
            type: 'Twitch Subscriber Badge',
            url: 'https://example.com/subscriber.png',
          },
        ],
        id: 'hydrating-badge-message',
      }),
      baseOptions,
    );

    expect(withoutBadgeHeight).toBe(19);
    expect(withBadgeHeight).toBe(22);
  });
});
