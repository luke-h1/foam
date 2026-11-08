import {
  createBadge,
  createEmoteData,
  createTwitchEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
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
import { getSharedChatBadgeContext } from '@app/store/chat/actions/shared-chat-badges/getSharedChatBadgeContext';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

import {
  createNoticeMessage,
  createSystemMessage,
} from './__fixtures__/message-enrichment.fixture';
import {
  enrichedMessageIds,
  storedMessage,
  summariseTokens,
  type TokenSummary,
} from './__fixtures__/messages.fixture';

const channelId = 'channel-1';

const kappa = createTwitchEmote({
  id: 'kappa-id',
  url: 'https://cdn.example.test/kappa.webp',
});

const subscriberBadge = createBadge({
  id: '12',
  title: '1-Year Subscriber',
  url: 'https://cdn.example.test/sub-12.png',
});

const resolvedKappa: TokenSummary = {
  type: 'emote',
  content: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
};

function createSubscriberMessage(
  messageId: string,
  text: string,
): AnyChatMessageType {
  return createChatMessageFixture({
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
    expect(shouldEnrichMessage(createChatMessageFixture())).toBe(true);
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

  test('keeps the shared-chat source badges like the other enrichment paths', async () => {
    const sourceSubscriberBadge: SanitisedBadgeSet = {
      ...subscriberBadge,
      title: 'Source channel subscriber',
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

    const userstate = createUserStateTags({
      'badges-raw': 'subscriber/12',
      'source-room-id': 'enrich-source-room',
    });

    await getSharedChatBadgeContext(userstate);

    addMessages([
      createChatMessageFixture({
        id: 'shared',
        message_id: 'shared',
        message_nonce: 'nonce-shared',
        message: [createTextToken('Kappa')],
        userstate,
      }),
    ]);

    enrichMessageSet({
      channelId,
      emoteData,
      messages: chatStore$.messages.peek(),
      show7TvEmotes: true,
      userLogin: 'me',
    });

    expect(storedMessage('shared').badges?.map(badge => badge.set)).toEqual([
      'shared-chat-source',
      'subscriber',
    ]);
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

  test('commits the first batch at once and the later batches together', () => {
    jest.useFakeTimers();

    try {
      const messages = Array.from({ length: 30 }, (_, index) =>
        createSubscriberMessage(`msg-${index}`, 'Kappa'),
      );

      addMessages(messages);

      enrichMessageSet({
        channelId,
        emoteData,
        messages: chatStore$.messages.peek(),
        show7TvEmotes: true,
        userLogin: 'me',
      });

      const firstBatchIds = [
        'msg-0',
        'msg-1',
        'msg-2',
        'msg-3',
        'msg-4',
        'msg-5',
      ];

      expect(enrichedMessageIds()).toEqual(firstBatchIds);

      jest.runOnlyPendingTimers();

      expect(enrichedMessageIds()).toEqual(firstBatchIds);

      jest.runAllTimers();

      expect(enrichedMessageIds()).toEqual(
        messages.map(message => message.message_id),
      );
    } finally {
      jest.useRealTimers();
    }
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

      const firstBatchIds = [
        'msg-0',
        'msg-1',
        'msg-2',
        'msg-3',
        'msg-4',
        'msg-5',
      ];

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

    const message = createChatMessageFixture({
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
    const message = createChatMessageFixture({
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
    const message = createChatMessageFixture({
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
    const message = createChatMessageFixture({
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

afterEach(flushChatStoreTimers);
