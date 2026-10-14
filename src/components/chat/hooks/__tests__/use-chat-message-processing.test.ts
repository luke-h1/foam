import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  createBadge,
  createChatMessage,
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { createScrollAnchor } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat-scroll.fixture';
import { useChatMessageProcessing } from '@app/components/chat/hooks/use-chat-message-processing';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/user-info.fixture';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import {
  enrichedMessageIds,
  storedMessage,
  storedTokens,
  type TokenSummary,
} from '@app/store/chat/__tests__/__fixtures__/messages.fixture';
import {
  addBadge,
  clearUserCosmeticsCache,
  setUserBadge,
} from '@app/store/chat/actions/cosmetics';
import {
  addMessage,
  addMessages,
  clearMessages,
} from '@app/store/chat/actions/messages';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import { clearFetchedCosmeticsUsers } from '@app/store/chat/actions/user-cosmetics-fetch';
import {
  clearVisibleAssetHydration,
  visibleAssetHydration,
} from '@app/store/chat/actions/visible-asset-hydration';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  type AnyChatMessageType,
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import {
  getPreferences,
  replacePreferences,
} from '@app/store/preference-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

const channelId = 'channel-1';

const channelEmote = createSevenTvEmote({
  name: 'OMEGALUL',
  url: 'https://cdn.example.test/omegalul.webp',
});

const personalEmote = createSevenTvEmote({
  id: 'personal-1',
  name: 'Personal',
  original_name: 'Personal',
  url: 'https://cdn.example.test/personal.webp',
});

const subscriberEmote = createTwitchEmote({
  id: 'subscriber-1',
  name: 'SubOnly',
  original_name: 'SubOnly',
  site: 'Twitch Subscriber',
  url: 'https://cdn.example.test/subonly.webp',
});

const subscriberBadge = createBadge({
  id: '12',
  set: 'subscriber',
  url: 'https://cdn.example.test/sub-12.png',
});

const sevenTvBadge: SanitisedBadgeSet = {
  id: '7tv-badge-1',
  set: '7tv-badge-1',
  type: '7TV Badge',
  title: '7TV Subscriber',
  url: 'https://cdn.7tv.app/badge/7tv-badge-1/4x.webp',
  provider: '7tv',
};

const sharedChatSourceBadge: SanitisedBadgeSet = {
  id: 'source-room',
  set: 'shared-chat-source',
  type: 'Twitch Shared Chat Source',
  title: 'Shared chat: SourceChannel',
  url: 'https://cdn.example.test/source.png',
  owner_username: 'sourcechannel',
  provider: 'twitch',
};

const resolvedOmegalul: TokenSummary = {
  type: 'emote',
  content: 'OMEGALUL',
  url: 'https://cdn.example.test/omegalul.webp',
};

const resolvedPersonal: TokenSummary = {
  type: 'emote',
  content: 'Personal',
  url: 'https://cdn.example.test/personal.webp',
};

const space: TokenSummary = { type: 'text', content: ' ' };

function seedChannelCache() {
  chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

  chatStore$.persisted.channelCaches.set({
    [channelId]: {
      ...makeEmptyEmoteData(),
      sevenTvChannelEmotes: [channelEmote],
      twitchSubscriberEmotes: [subscriberEmote],
      twitchChannelBadges: [subscriberBadge],
    },
  });
}

async function seedPersonalEmotes(twitchUserId: string) {
  getPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);
  await fetchUserPersonalEmotes(twitchUserId, channelId);
}

let getPersonalEmoteSet: jest.SpiedFunction<
  typeof sevenTvService.getPersonalEmoteSet
>;

function renderMessageProcessing() {
  const maintainBottomAfterContentChange = jest.fn();

  const handleNewMessage = jest.fn(
    (message: AnyChatMessageType, _options?: { countUnread?: boolean }) => {
      addMessage(message);
    },
  );

  const hook = renderHook(() =>
    useChatMessageProcessing({
      channelId,
      handleNewMessage,
      messages$: chatStore$.messages,
      scrollAnchor: createScrollAnchor({
        isAtBottomRef: { current: true },
        maintainBottomAfterContentChange,
      }),
      show7TvEmotes: true,
      show7tvBadges: true,
      userLogin: 'viewer',
    }),
  );

  return { handleNewMessage, hook, maintainBottomAfterContentChange };
}

/**
 * Runs the debounce timer, the batch delays and the promise chain behind a
 * hydration pass. `waitFor` does not return under fake timers here, so the
 * test steps the timers itself.
 */
async function runHydrationPass() {
  for (let step = 0; step < 10; step += 1) {
    // eslint-disable-next-line react-doctor/async-await-in-loop -- each step must settle before the next timer advance
    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });
  }
}

describe('useChatMessageProcessing', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    clearMessages();
    clearPersonalEmotesCache();
    clearUserCosmeticsCache();
    clearFetchedCosmeticsUsers();
    clearVisibleAssetHydration();
    chatStore$.personalEmotesVersion.set(0);
    chatStore$.currentChannelId.set(null);
    chatStore$.emojis.set([]);

    replacePreferences({
      ...getPreferences(),
      disableEmoteAnimations: true,
      show7TvEmotes: true,
      show7tvBadges: true,
    });

    seedChannelCache();

    jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});

    jest
      .spyOn(bttvEmoteService, 'getSanitisedGlobalBadges')
      .mockResolvedValue([]);

    getPersonalEmoteSet = jest
      .spyOn(sevenTvService, 'getPersonalEmoteSet')
      .mockResolvedValue([]);

    jest.spyOn(sevenTvService, 'get7tvUserId').mockResolvedValue('');

    jest.spyOn(twitchService, 'getUser').mockResolvedValue({
      ...userInfoFixture,
      login: 'sourcechannel',
      display_name: 'SourceChannel',
      profile_image_url: 'https://cdn.example.test/source.png',
    });

    jest
      .spyOn(twitchBadgeService, 'listSanitisedChannelBadges')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('processes a live IRC message with personal, tagged, and subscriber emotes', async () => {
    await seedPersonalEmotes('viewer-id');

    const sourceSubscriberBadge: SanitisedBadgeSet = {
      ...subscriberBadge,
      url: 'https://cdn.example.test/source-sub-12.png',
    };

    jest
      .spyOn(twitchBadgeService, 'listSanitisedChannelBadges')
      .mockResolvedValue([sourceSubscriberBadge]);

    const baseMessage = createChatMessage({
      tags: {
        badges: 'subscriber/12',
        emotes: '25:0-4',
        id: 'msg-1',
        login: 'viewer',
        'display-name': 'Viewer',
        'source-room-id': 'source-room',
        'user-id': 'viewer-id',
      },
      text: 'Kappa Personal SubOnly OMEGALUL',
    });

    const { handleNewMessage, hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.processMessageEmotes(
        'Kappa Personal SubOnly OMEGALUL',
        baseMessage.userstate,
        baseMessage,
        'viewer-id',
        false,
      );
    });

    expect(handleNewMessage.mock.calls[0]?.[1]).toEqual({
      countUnread: false,
    });

    expect({
      tokens: storedTokens('msg-1'),
      badges: storedMessage('msg-1').badges,
    }).toEqual({
      tokens: [
        {
          type: 'emote',
          content: 'Kappa',
          url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        },
        space,
        resolvedPersonal,
        space,
        {
          type: 'emote',
          content: 'SubOnly',
          url: 'https://cdn.example.test/subonly.webp',
        },
        space,
        resolvedOmegalul,
      ],
      badges: [subscriberBadge],
    });

    // The shared-chat context was not cached, so the source badge and the
    // source channel's subscriber badge land afterwards.
    await waitFor(() => {
      expect(storedMessage('msg-1').badges).toEqual<SanitisedBadgeSet[]>([
        sharedChatSourceBadge,
        sourceSubscriberBadge,
      ]);
    });
  });

  test('falls back to the base message when no channel emote data is available', () => {
    chatStore$.persisted.channelCaches.set({});
    const baseMessage = createChatMessage({ text: 'hello OMEGALUL' });
    const { handleNewMessage, hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.processMessageEmotes(
        'hello OMEGALUL',
        baseMessage.userstate,
        baseMessage,
      );
    });

    expect(handleNewMessage.mock.calls[0]).toEqual([
      baseMessage,
      { countUnread: true },
    ]);
  });

  test('debounces visible message hydration and maintains bottom anchoring when visible messages are reprocessed', async () => {
    await seedPersonalEmotes('visible-user');
    jest.useFakeTimers();

    const visibleMessage = createChatMessage({
      tags: { id: 'visible-1', 'user-id': 'visible-user' },
      text: 'visible Personal',
    });

    const otherMessage = createChatMessage({
      tags: { id: 'visible-2', 'user-id': 'other-user' },
      text: 'other Personal',
    });

    addMessages([visibleMessage, otherMessage]);

    const { hook, maintainBottomAfterContentChange } =
      renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([visibleMessage]);

      hook.result.current.handleViewableMessagesChange([
        visibleMessage,
        otherMessage,
      ]);
    });

    expect(storedTokens('visible-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'visible Personal' },
    ]);

    await runHydrationPass();

    expect(maintainBottomAfterContentChange).toHaveBeenCalledTimes(1);

    expect({
      visible: storedTokens('visible-1'),
      other: storedTokens('visible-2'),
      pendingMessages: visibleAssetHydration.pendingMessages,
    }).toEqual({
      visible: [{ type: 'text', content: 'visible' }, space, resolvedPersonal],
      other: [{ type: 'text', content: 'other Personal' }],
      pendingMessages: [],
    });
  });

  test('re-hydrates the currently visible messages when the personal emotes version bumps', async () => {
    jest.useFakeTimers();

    const visibleMessage = createChatMessage({
      tags: { id: 'visible-1', 'user-id': 'late-user' },
      text: 'visible Personal',
    });

    addMessages([visibleMessage]);
    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([visibleMessage]);
    });

    await runHydrationPass();

    expect(getPersonalEmoteSet.mock.calls).toEqual([['late-user']]);

    expect(storedTokens('visible-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'visible Personal' },
    ]);

    // The set arrives later through another path, which bumps the version.
    clearPersonalEmotesCache();

    await act(async () => {
      await seedPersonalEmotes('late-user');
    });

    expect(visibleAssetHydration.hydratedMessageKeys).toEqual(new Set());

    await runHydrationPass();

    expect(storedTokens('visible-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'visible' },
      space,
      resolvedPersonal,
    ]);
  });

  test('does not schedule a hydration pass for the mount-time personal emotes version', () => {
    jest.useFakeTimers();
    renderMessageProcessing();

    expect(visibleAssetHydration.timer).toBeNull();
  });

  test('reprocessAllMessages rewrites the stored messages with the current emotes', () => {
    addMessages([
      createChatMessage({
        tags: { id: 'stored-1', badges: 'subscriber/12' },
        text: 'stored OMEGALUL',
      }),
    ]);

    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.reprocessAllMessages();
    });

    expect({
      tokens: storedTokens('stored-1'),
      badges: storedMessage('stored-1').badges,
    }).toEqual({
      tokens: [{ type: 'text', content: 'stored' }, space, resolvedOmegalul],
      badges: [subscriberBadge],
    });
  });

  test('a channel switch cancels an in-flight reprocess walk', () => {
    jest.useFakeTimers();

    const messages = Array.from({ length: 8 }, (_, index) =>
      createChatMessage({
        tags: { id: `stored-${index}` },
        text: `stored OMEGALUL ${index}`,
      }),
    );

    addMessages(messages);

    const hook = renderHook(
      ({ channelId: currentChannelId }: { channelId: string }) =>
        useChatMessageProcessing({
          channelId: currentChannelId,
          handleNewMessage: jest.fn(),
          messages$: chatStore$.messages,
          scrollAnchor: createScrollAnchor(),
          show7TvEmotes: true,
          show7tvBadges: true,
          userLogin: 'viewer',
        }),
      { initialProps: { channelId } },
    );

    act(() => {
      hook.result.current.reprocessAllMessages();
    });

    const firstBatchIds = messages
      .slice(0, 6)
      .map(message => message.message_id);

    expect(enrichedMessageIds()).toEqual(firstBatchIds);

    hook.rerender({ channelId: 'channel-2' });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(enrichedMessageIds()).toEqual(firstBatchIds);
  });

  test('hydrates a visible row with a fetched personal emote and a cached 7TV badge', async () => {
    jest.useFakeTimers();

    getPersonalEmoteSet.mockImplementation(async twitchUserId =>
      twitchUserId === 'emote-user' ? [personalEmote] : [],
    );

    addBadge(sevenTvBadge);
    setUserBadge('badge-user', sevenTvBadge.id);

    const emoteMessage = createChatMessage({
      tags: { id: 'emote-row', 'user-id': 'emote-user' },
      text: 'Personal',
    });

    const badgeMessage = createChatMessage({
      tags: { id: 'badge-row', 'user-id': 'badge-user' },
      text: 'hello',
    });

    addMessages([emoteMessage, badgeMessage]);
    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([
        emoteMessage,
        badgeMessage,
      ]);
    });

    await runHydrationPass();

    expect({
      emoteRow: storedTokens('emote-row'),
      badgeRowBadges: storedMessage('badge-row').badges,
    }).toEqual({
      emoteRow: [resolvedPersonal],
      badgeRowBadges: [sevenTvBadge],
    });
  });
});
