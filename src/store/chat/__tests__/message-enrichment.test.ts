import { userInfoFixture } from '@app/services/__fixtures__/twitch/user-info.fixture';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import {
  enrichMessageSet,
  hasEnrichmentEmoteSources,
  resolveVisibleMessageUpdate,
  shouldEnrichMessage,
} from '@app/store/chat/actions/message-enrichment';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  type AnyChatMessageType,
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

import {
  createMockMessage,
  createNoticeMessage,
  createSystemMessage,
} from './__fixtures__/message-enrichment.fixture';
import {
  enrichedMessageIds,
  storedMessage,
  summariseTokens,
  type TokenSummary,
} from './__fixtures__/messages.fixture';

type ChatEmoteData = Parameters<typeof enrichMessageSet>[0]['emoteData'];

const channelId = 'channel-1';

const kappa: SanitisedEmote = {
  id: 'kappa-id',
  name: 'Kappa',
  original_name: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
  creator: null,
  emote_link: '',
  site: 'Twitch Channel',
  provider: 'twitch',
};

const subscriberBadge: SanitisedBadgeSet = {
  id: '12',
  set: 'subscriber',
  type: 'Twitch Channel Badge',
  title: '1-Year Subscriber',
  url: 'https://cdn.example.test/sub-12.png',
  provider: 'twitch',
};

const resolvedKappa: TokenSummary = {
  type: 'emote',
  content: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
};

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

function createSubscriberMessage(
  messageId: string,
  text: string,
): AnyChatMessageType {
  return createMockMessage({
    id: messageId,
    message_id: messageId,
    message_nonce: `nonce-${messageId}`,
    message: [createTextToken(text)],
    userstate: createUserStateTags({ 'badges-raw': 'subscriber/12' }),
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  clearMessages();
  chatStore$.emojis.set([]);
  chatStore$.persisted.channelCaches.set({});

  jest
    .spyOn(bttvEmoteService, 'getSanitisedGlobalBadges')
    .mockResolvedValue([]);
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
  const emoteData = createEmoteData({
    twitchChannelEmotes: [kappa],
    twitchChannelBadges: [subscriberBadge],
  });

  test('recomputes every message when no processed-id set is given', () => {
    addMessages([
      createSubscriberMessage('a', 'first Kappa'),
      createSubscriberMessage('b', 'Kappa'),
    ]);

    enrichMessageSet({
      channelId,
      emoteData,
      messages: chatStore$.messages.peek(),
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect({
      aTokens: summariseTokens(storedMessage('a').message),
      aBadges: storedMessage('a').badges,
      bTokens: summariseTokens(storedMessage('b').message),
    }).toEqual({
      aTokens: [
        { type: 'text', content: 'first' },
        { type: 'text', content: ' ' },
        resolvedKappa,
      ],
      aBadges: [subscriberBadge],
      bTokens: [resolvedKappa],
    });
  });

  test('skips messages already in the processed-id set', () => {
    const processedMessageIds = new Set(['a']);

    addMessages([
      createSubscriberMessage('a', 'Kappa'),
      createSubscriberMessage('b', 'Kappa'),
    ]);

    enrichMessageSet({
      channelId,
      emoteData,
      messages: chatStore$.messages.peek(),
      processedMessageIds,
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(enrichedMessageIds()).toEqual(['b']);

    expect(processedMessageIds).toEqual(new Set(['a', 'b']));
  });

  test('cancelling stops the remaining batches', () => {
    jest.useFakeTimers();

    try {
      const messages = Array.from({ length: 30 }, (_, index) =>
        createSubscriberMessage(`msg-${index}`, 'Kappa'),
      );

      addMessages(messages);

      const cancel = enrichMessageSet({
        channelId,
        emoteData,
        messages: chatStore$.messages.peek(),
        show7TvEmotes: true,
        userLogin: 'me',
      });

      const firstBatchIds = messages
        .slice(0, 6)
        .map(message => message.message_id);

      expect(enrichedMessageIds()).toEqual(firstBatchIds);

      cancel();
      jest.runAllTimers();

      expect(enrichedMessageIds()).toEqual(firstBatchIds);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('resolveVisibleMessageUpdate', () => {
  beforeEach(() => {
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchChannelEmotes: [kappa],
        twitchChannelBadges: [subscriberBadge],
      },
    });
  });

  test('resolves tokens and the shared-chat badges without publishing', async () => {
    const sourceSubscriberBadge: SanitisedBadgeSet = {
      ...subscriberBadge,
      title: 'Source channel subscriber',
      url: 'https://cdn.example.test/source-sub-12.png',
    };

    jest.spyOn(twitchService, 'getUser').mockResolvedValue({
      ...userInfoFixture,
      login: 'sourcechannel',
      display_name: 'SourceChannel',
      profile_image_url: 'https://cdn.example.test/source.png',
    });

    jest
      .spyOn(twitchBadgeService, 'listSanitisedChannelBadges')
      .mockResolvedValue([sourceSubscriberBadge]);

    const message = createMockMessage({
      message_id: 'visible-1',
      message_nonce: 'nv',
      message: [createTextToken('hello Kappa')],
      userstate: createUserStateTags({
        'badges-raw': 'subscriber/12',
        'source-room-id': 'source-room',
      }),
    });

    addMessages([message]);

    const update = await resolveVisibleMessageUpdate({
      channelId,
      message,
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect({
      messageId: update?.messageId,
      messageNonce: update?.messageNonce,
      tokens: summariseTokens(update?.updates.message ?? []),
      badges: update?.updates.badges,
      storedTokens: summariseTokens(storedMessage('visible-1').message),
    }).toEqual({
      messageId: 'visible-1',
      messageNonce: 'nv',
      tokens: [
        { type: 'text', content: 'hello' },
        { type: 'text', content: ' ' },
        resolvedKappa,
      ],
      badges: [
        {
          id: 'source-room',
          set: 'shared-chat-source',
          type: 'Twitch Shared Chat Source',
          title: 'Shared chat: SourceChannel',
          url: 'https://cdn.example.test/source.png',
          owner_username: 'sourcechannel',
          provider: 'twitch',
        },
        sourceSubscriberBadge,
      ],
      storedTokens: [{ type: 'text', content: 'hello Kappa' }],
    });
  });

  test('keeps a stored gif when rebuilt text is shorter than the tag offsets', async () => {
    const message = createMockMessage({
      message_id: 'gif-1',
      message_nonce: 'gif-nonce',
      message: [
        createTextToken('hi '),
        {
          type: 'gif',
          content: '[YAY]',
          gifId: 'abc',
          url: 'https://example.com/a.gif',
        },
      ],
      userstate: createUserStateTags({
        gifs: '4-8|abc|https://example.com/a.gif',
      }),
    });

    const update = await resolveVisibleMessageUpdate({
      channelId,
      message,
      show7TvEmotes: true,
      showChatGifs: true,
      userLogin: 'me',
    });

    expect(summariseTokens(update?.updates.message ?? [])).toEqual<
      TokenSummary[]
    >([
      { type: 'text', content: 'hi' },
      { type: 'text', content: ' ' },
      { type: 'gif', content: '[YAY]' },
    ]);
  });

  test('keeps a tagged Twitch emote beside a stored gif', async () => {
    const message = createMockMessage({
      message_id: 'tagged-gif-1',
      message_nonce: 'tagged-gif-nonce',
      message: [
        createTextToken('foo '),
        {
          type: 'gif',
          content: '[YAY]',
          gifId: 'abc',
          url: 'https://example.com/a.gif',
        },
      ],
      userstate: createUserStateTags({
        emotes: '999:0-2',
        gifs: '4-8|abc|https://example.com/a.gif',
      }),
    });

    const update = await resolveVisibleMessageUpdate({
      channelId,
      message,
      show7TvEmotes: true,
      showChatGifs: true,
      userLogin: 'me',
    });

    expect(summariseTokens(update?.updates.message ?? [])).toEqual<
      TokenSummary[]
    >([
      {
        type: 'emote',
        content: 'foo',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/999/default/dark/3.0',
      },
      { type: 'text', content: ' ' },
      { type: 'gif', content: '[YAY]' },
    ]);
  });

  test('reprocesses a link beside an overlaid emote', async () => {
    const message = createMockMessage({
      message_id: 'overlay-1',
      message_nonce: 'overlay-nonce',
      message: [
        {
          type: 'emote',
          ...kappa,
          content: kappa.name,
          overlaid: [
            {
              type: 'emote',
              content: 'SoSnowy',
              id: 'snow',
              name: 'SoSnowy',
              original_name: 'SoSnowy',
              url: 'https://cdn.example.test/snow.webp',
              creator: null,
              emote_link: '',
              site: '7TV Global',
              provider: '7tv',
            },
          ],
        },
        createTextToken(' '),
        { type: 'link', content: 'https://example.com' },
      ],
    });

    const update = await resolveVisibleMessageUpdate({
      channelId,
      message,
      show7TvEmotes: true,
      showChatGifs: true,
      userLogin: 'me',
    });

    expect(summariseTokens(update?.updates.message ?? [])).toEqual<
      TokenSummary[]
    >([
      resolvedKappa,
      { type: 'text', content: ' ' },
      { type: 'text', content: 'SoSnowy' },
      { type: 'text', content: ' ' },
      { type: 'link', content: 'https://example.com' },
    ]);
  });

  test('skips system messages', async () => {
    const update = await resolveVisibleMessageUpdate({
      channelId,
      message: createSystemMessage(),
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(update).toBeNull();
  });
});
