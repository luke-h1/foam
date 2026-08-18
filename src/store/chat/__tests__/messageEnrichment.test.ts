import * as channelLoadModule from '@app/store/chat/actions/channelLoad';
import {
  enrichMessageSet,
  enrichVisibleMessage,
  hasEnrichmentEmoteSources,
  shouldEnrichMessage,
} from '@app/store/chat/actions/messageEnrichment';
import * as messagesModule from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { SanitisedEmote } from '@app/types/emote';
import {
  createEmotePart,
  createTextPart,
} from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';
import * as resolveMessageEmotePartsModule from '@app/utils/chat/resolveMessageEmoteParts';
import * as getMessageBadgesModule from '@app/utils/chat/sharedChatBadges/getMessageBadges';
import * as getSharedChatBadgeContextModule from '@app/utils/chat/sharedChatBadges/getSharedChatBadgeContext';

import {
  createMockMessage,
  createNoticeMessage,
  createSystemMessage,
} from './__fixtures__/messageEnrichment.fixture';

const mockGetCurrentEmoteData = jest.spyOn(
  channelLoadModule,
  'getCurrentEmoteData',
);
const mockGetMessageBadges = jest.spyOn(
  getMessageBadgesModule,
  'getMessageBadges',
);
const mockGetSharedChatBadgeContext = jest.spyOn(
  getSharedChatBadgeContextModule,
  'getSharedChatBadgeContext',
);
const mockResolveMessageEmoteParts = jest.spyOn(
  resolveMessageEmotePartsModule,
  'resolveMessageEmoteParts',
);
const mockUpdateMessages = jest.spyOn(messagesModule, 'updateMessages');

type ChatEmoteData = NonNullable<
  ReturnType<typeof channelLoadModule.getCurrentEmoteData>
>;
type ResolveMessageEmotePartsParams = Parameters<
  typeof resolveMessageEmotePartsModule.resolveMessageEmoteParts
>[0];

function createEmoteData(
  overrides: Partial<ChatEmoteData> = {},
): ChatEmoteData {
  return {
    twitchChannelEmotes: [],
    twitchGlobalEmotes: [],
    twitchSubscriberEmotes: [],
    sevenTvChannelEmotes: [],
    sevenTvGlobalEmotes: [],
    ffzChannelEmotes: [],
    ffzGlobalEmotes: [],
    bttvGlobalEmotes: [],
    bttvChannelEmotes: [],
    twitchChannelBadges: [],
    twitchGlobalBadges: [],
    ffzChannelBadges: [],
    ffzGlobalBadges: [],
    chatterinoBadges: [],
    bttvBadges: [],
    ...overrides,
  };
}

const expectMessageUpdate = (id: string, nonce: string, text: string) => ({
  messageId: id,
  messageNonce: nonce,
  updates: {
    message: [createEmotePart(text, { id: 'e1', url: '' })],
    badges: [],
  },
});

describe('shouldEnrichMessage', () => {
  test('returns true for regular user messages', () => {
    expect(shouldEnrichMessage(createMockMessage())).toBe(true);
  });

  test('returns false for system messages', () => {
    expect(shouldEnrichMessage(createSystemMessage())).toBe(false);
  });

  test('returns false for usernotice messages', () => {
    expect(shouldEnrichMessage(createNoticeMessage())).toBe(false);
  });

  test('returns true for announcements', () => {
    expect(
      shouldEnrichMessage({
        ...createNoticeMessage(),
        isAnnouncement: true,
      }),
    ).toBe(true);
  });

  test('returns true for highlighted messages', () => {
    expect(
      shouldEnrichMessage({
        ...createNoticeMessage(),
        isHighlightedMessage: true,
      }),
    ).toBe(true);
  });
});

describe('hasEnrichmentEmoteSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.emojis.set([]);
  });

  test('returns false when every emote source is empty', () => {
    expect(hasEnrichmentEmoteSources(createEmoteData())).toBe(false);
  });

  test('returns true when personal emotes are included regardless of channel data', () => {
    expect(
      hasEnrichmentEmoteSources(createEmoteData(), {
        includePersonalEmotes: true,
      }),
    ).toBe(true);
  });

  test('returns true when only subscriber emotes are loaded', () => {
    expect(
      hasEnrichmentEmoteSources(
        createEmoteData({
          twitchSubscriberEmotes: [
            {
              id: 'sub-1',
              name: 'SubOnly',
              original_name: 'SubOnly',
              url: '',
              creator: null,
              emote_link: '',
              site: 'Twitch Subscriber',
              provider: 'twitch',
            } satisfies SanitisedEmote,
          ],
        }),
      ),
    ).toBe(true);
  });

  test('returns true when emoji emotes are loaded', () => {
    chatStore$.emojis.set([
      {
        id: 'emoji-1',
        name: '😀',
        original_name: '😀',
        url: '',
        creator: null,
        emote_link: '',
        site: 'Emoji',
        provider: 'emoji',
      } satisfies SanitisedEmote,
    ]);
    expect(hasEnrichmentEmoteSources(createEmoteData())).toBe(true);
  });
});

describe('enrichMessageSet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.emojis.set([]);
    mockResolveMessageEmoteParts.mockImplementation(
      ({ text }: ResolveMessageEmotePartsParams) => [
        createEmotePart(text, { id: 'e1', url: '' }),
      ],
    );
  });

  test('recomputes every message when no processed-id set is given', () => {
    const messages = [
      createMockMessage({
        message_id: 'a',
        message_nonce: 'na',
        message: [createTextPart('first')],
      }),
      createMockMessage({
        message_id: 'b',
        message_nonce: 'nb',
        message: [createTextPart('second')],
      }),
    ];

    enrichMessageSet({
      channelId: 'channel-1',
      emoteData: createEmoteData(),
      messages,
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('a', 'na', 'first'),
      expectMessageUpdate('b', 'nb', 'second'),
    ]);
  });

  test('skips messages already in the processed-id set', () => {
    const processedMessageIds = new Set(['a']);
    const messages = [
      createMockMessage({
        message_id: 'a',
        message_nonce: 'na',
        message: [createTextPart('first')],
      }),
      createMockMessage({
        message_id: 'b',
        message_nonce: 'nb',
        message: [createTextPart('second')],
      }),
    ];

    enrichMessageSet({
      channelId: 'channel-1',
      emoteData: createEmoteData(),
      messages,
      processedMessageIds,
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('b', 'nb', 'second'),
    ]);
    expect(processedMessageIds).toEqual(new Set(['a', 'b']));
  });

  test('cancelling stops the remaining batches', () => {
    jest.useFakeTimers();
    try {
      const messages = Array.from({ length: 30 }, (_, index) =>
        createMockMessage({
          message_id: `msg-${index}`,
          message_nonce: `nonce-${index}`,
          message: [createTextPart(`text ${index}`)],
        }),
      );

      const cancel = enrichMessageSet({
        channelId: 'channel-1',
        emoteData: createEmoteData(),
        messages,
        show7TvEmotes: true,
        userLogin: 'me',
      });

      expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
      expect(mockUpdateMessages.mock.calls[0]?.[0]).toHaveLength(6);

      cancel();
      jest.runOnlyPendingTimers();

      expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('enrichVisibleMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.emojis.set([]);
    mockResolveMessageEmoteParts.mockImplementation(
      ({ text }: ResolveMessageEmotePartsParams) => [
        createEmotePart(text, { id: 'e1', url: '' }),
      ],
    );
    mockGetCurrentEmoteData.mockReturnValue(createEmoteData());
    mockGetSharedChatBadgeContext.mockResolvedValue({
      sourceBadge: null,
      sourceChannelBadges: null,
    });
    mockGetMessageBadges.mockReturnValue([]);
  });

  test('rewrites parts and badges from the current caches', async () => {
    const message = createMockMessage({
      message_id: 'visible-1',
      message_nonce: 'nv',
      message: [createTextPart('hello')],
    });

    await enrichVisibleMessage({
      channelId: 'channel-1',
      message,
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(mockGetSharedChatBadgeContext).toHaveBeenCalledWith(
      message.userstate,
    );
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('visible-1', 'nv', 'hello'),
    ]);
  });

  test('skips system messages', async () => {
    await enrichVisibleMessage({
      channelId: 'channel-1',
      message: createSystemMessage(),
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });
});
