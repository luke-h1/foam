import {
  createBadge,
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/user-info.fixture';
import { sevenTvService } from '@app/services/seven-tv-service';
import * as GetBttvBadgesModule from '@app/store/chat/actions/bttv-badges/getBttvBadges';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import { stubEmoteProviderServices } from '@app/test/emote-provider-services';
import { silenceLogger } from '@app/test/silence-logger';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SanitisedEmote,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { cheermoteFetchGuard } from '@app/utils/chat/cheermote-store/cheermoteFetchGuard';

import {
  clearCache,
  clearSubscriberProfilesCache,
  invalidateChatResourceCaches,
  loadChannelResources,
  resolveSubscriberChannelProfiles,
} from '../actions/channel-load';
import { clearGlobalResourceCache } from '../actions/channel-resources';
import { clearMessages } from '../actions/messages';
import {
  clearPersonalEmotesCache,
  getUserPersonalEmotes,
} from '../actions/personal-emotes';
import {
  switchSevenTvEmoteSet,
  updateSevenTvEmotes,
} from '../actions/seven-tv-channel-lifecycle';
import { chatStore$ } from '../observables/chat-store';
import type { SubscriberChannelProfile } from '../types/constants';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '../types/constants';

silenceLogger();

// Isolates the resource loader from the BTTV global-badge micro-cache's own
// fetch/retry cascade, which is exercised by getBttvBadges' own spec.
const mockClearBttvBadgesCache = jest
  .spyOn(GetBttvBadgesModule, 'clearBttvBadgesCache')
  .mockImplementation(() => {});

jest.spyOn(GetBttvBadgesModule, 'getBttvBadges').mockReturnValue([]);

const {
  getEmoteSetId: mockGetEmoteSetId,
  getSanitisedEmoteSet: mockGetSanitisedEmoteSet,
  get7tvUserId: mockGet7tvUserId,
  sendPresence: mockSendPresence,
  getChannelEmotes: mockGetChannelEmotes,
  getGlobalEmotes: mockGetGlobalEmotes,
  getSubscriberEmotes: mockGetSubscriberEmotes,
  getBttvGlobalEmotes: mockGetBttvGlobalEmotes,
  getBttvChannelEmotes: mockGetBttvChannelEmotes,
  getFfzChannelEmotes: mockGetFfzChannelEmotes,
  getFfzGlobalEmotes: mockGetFfzGlobalEmotes,
  listTwitchChannelBadges: mockListTwitchChannelBadges,
  listTwitchGlobalBadges: mockListTwitchGlobalBadges,
  getFfzChannelBadges: mockGetFfzChannelBadges,
  getFfzGlobalBadges: mockGetFfzGlobalBadges,
  listChatterinoBadges: mockListChatterinoBadges,
  getPersonalEmoteSet: mockGetPersonalEmoteSet,
  getUsersById: mockGetUsersById,
} = stubEmoteProviderServices();

const channelId = 'channel-1';
const twitchUserId = 'user-1';

function sevenTvEmote(id: string) {
  return createSevenTvEmote({
    id,
    name: id,
    original_name: id,
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  });
}

function bttvEmote(
  id: string,
  site: 'BTTV' | 'Global BTTV' = 'BTTV',
): BttvSanitisedEmote {
  return {
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    provider: 'bttv',
    site,
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  };
}

function ffzEmote(
  id: string,
  site: 'FFZ' | 'Global FFZ' = 'FFZ',
): FfzSanitisedEmote {
  return {
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    provider: 'ffz',
    site,
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  };
}

function twitchEmote(
  id: string,
  site:
    | 'Twitch Channel'
    | 'Twitch Global'
    | 'Twitch Subscriber' = 'Twitch Channel',
) {
  return createTwitchEmote({
    id,
    name: id,
    original_name: id,
    site,
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  });
}

function badge(id: string) {
  return createBadge({
    id,
    set: id,
    title: id,
    type: 'FFZ Global Badge',
    provider: 'ffz',
    url: `https://example.com/${id}.png`,
  });
}

function ids(items: readonly { id: string }[]): string[] {
  return items.map(item => item.id);
}

describe('loadChannelResources cache fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
    chatStore$.persisted.channelCaches.set({});
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    clearPersonalEmotesCache();
    clearGlobalResourceCache();

    mockGetPersonalEmoteSet.mockResolvedValue([]);
    mockGetUsersById.mockResolvedValue([]);
    mockGetEmoteSetId.mockResolvedValue('seven-set');

    mockGetSanitisedEmoteSet.mockImplementation(id =>
      Promise.resolve([sevenTvEmote(`seven-${id}`)]),
    );

    mockGet7tvUserId.mockResolvedValue('');
    mockSendPresence.mockResolvedValue(undefined);
    mockGetChannelEmotes.mockResolvedValue([twitchEmote('twitch-channel-new')]);

    mockGetGlobalEmotes.mockResolvedValue([
      twitchEmote('twitch-global-new', 'Twitch Global'),
    ]);

    mockGetSubscriberEmotes.mockResolvedValue([]);

    mockGetBttvGlobalEmotes.mockResolvedValue([
      bttvEmote('bttv-global-new', 'Global BTTV'),
    ]);

    mockGetBttvChannelEmotes.mockResolvedValue([bttvEmote('bttv-channel-new')]);
    mockGetFfzChannelEmotes.mockResolvedValue([ffzEmote('ffz-channel-new')]);

    mockGetFfzGlobalEmotes.mockResolvedValue([
      ffzEmote('ffz-global-new', 'Global FFZ'),
    ]);

    mockListTwitchChannelBadges.mockResolvedValue([]);
    mockListTwitchGlobalBadges.mockResolvedValue([]);
    mockGetFfzChannelBadges.mockResolvedValue([badge('ffz-channel-badge-new')]);
    mockGetFfzGlobalBadges.mockResolvedValue([badge('ffz-global-badge-new')]);
    mockListChatterinoBadges.mockReturnValue([]);
  });

  afterEach(() => {
    // Scoped restore: restoreAllMocks() would revert the module-scope spies
    // to their real network-calling implementations for later describes.
    jest.spyOn(Date, 'now').mockRestore();
  });

  test('keeps cached provider slices when full refresh provider requests reject', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 2000,
        bttvChannelEmotes: [bttvEmote('bttv-channel-cached')],
        ffzChannelBadges: [badge('ffz-channel-badge-cached')],
        ffzChannelEmotes: [ffzEmote('ffz-channel-cached')],
        lastUpdated: 1000,
        sevenTvChannelEmotes: [sevenTvEmote('seven-channel-cached')],
        sevenTvEmoteSetId: 'cached-seven-set',
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [bttvEmote('bttv-global-cached', 'Global BTTV')],
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      ffzGlobalEmotes: [ffzEmote('ffz-global-cached', 'Global FFZ')],
      lastUpdated: 1000,
    });

    mockGetEmoteSetId.mockRejectedValue(new Error('TimeoutError'));

    mockGetSanitisedEmoteSet.mockImplementation(id =>
      id === 'cached-seven-set'
        ? Promise.reject(new Error('TimeoutError'))
        : Promise.resolve([sevenTvEmote(`seven-${id}-new`)]),
    );

    mockGetBttvGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetBttvChannelEmotes.mockResolvedValue([]);
    mockGetFfzChannelEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzChannelBadges.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(
      loadChannelResources({ channelId, forceRefresh: true, twitchUserId }),
    ).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(sevenTvService.getSanitisedEmoteSet).toHaveBeenCalledWith(
      'cached-seven-set',
    );

    expect(ids(cache!.sevenTvChannelEmotes)).toEqual(['seven-channel-cached']);

    expect(cache!.bttvChannelEmotes).toEqual([]);

    expect(ids(cache!.ffzChannelEmotes)).toEqual(['ffz-channel-cached']);

    expect(ids(cache!.ffzChannelBadges)).toEqual(['ffz-channel-badge-cached']);

    expect(cache!.lastUpdated).toBe(1000);

    expect(cache!.badgesLastUpdated).toBe(2000);

    const globalCache = chatStore$.persisted.globalCaches.peek();
    expect(ids(globalCache.bttvGlobalEmotes)).toEqual(['bttv-global-cached']);

    expect(ids(globalCache.ffzGlobalEmotes)).toEqual(['ffz-global-cached']);

    expect(ids(globalCache.ffzGlobalBadges)).toEqual([
      'ffz-global-badge-cached',
    ]);

    expect(ids(globalCache.twitchGlobalEmotes)).toEqual(['twitch-global-new']);

    expect(globalCache.lastUpdated).toBe(1000);
  });

  test('keeps cached badge slices when stale badge refresh requests reject', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 9000,
        ffzChannelBadges: [badge('ffz-channel-badge-cached')],
        lastUpdated: 3_650_000,
        sevenTvEmoteSetId: 'cached-seven-set',
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      lastUpdated: 3_650_000,
      sevenTvGlobalEmotes: [sevenTvEmote('seven-global-cached')],
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
    });

    mockGetFfzChannelBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(mockListTwitchChannelBadges).toHaveBeenCalledTimes(1);

    expect(ids(cache!.ffzChannelBadges)).toEqual(['ffz-channel-badge-cached']);

    expect(cache!.badgesLastUpdated).toBe(9000);

    expect(cache!.lastUpdated).toBe(3_650_000);

    expect(mockGetFfzGlobalBadges).not.toHaveBeenCalled();
  });

  test('keeps the cached subscriber slice when the cached-path refresh rejects', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 9000,
        lastUpdated: 9000,
        sevenTvEmoteSetId: 'cached-seven-set',
        twitchChannelEmotes: [twitchEmote('existing-emote')],
        twitchSubscriberEmotes: [twitchEmote('sub-emote-cached')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      lastUpdated: 9000,
      sevenTvGlobalEmotes: [sevenTvEmote('seven-global-cached')],
    });

    mockGetSubscriberEmotes.mockRejectedValue(new Error('TimeoutError'));

    await expect(
      loadChannelResources({ channelId, twitchUserId }),
    ).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect({
      ids: ids(cache!.twitchSubscriberEmotes),
      userId: cache!.twitchSubscriberEmotesUserId,
    }).toEqual({ ids: ['sub-emote-cached'], userId: undefined });
  });

  test('refreshes a stale global slot from the cached path without refetching channel slices', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 3_650_000,
        lastUpdated: 3_650_000,
        sevenTvEmoteSetId: 'cached-seven-set',
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      lastUpdated: 9000,
      sevenTvGlobalEmotes: [sevenTvEmote('seven-global-cached')],
    });

    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const globalCache = chatStore$.persisted.globalCaches.peek();
    expect(ids(globalCache.bttvGlobalEmotes)).toEqual(['bttv-global-new']);

    expect(ids(globalCache.twitchGlobalEmotes)).toEqual(['twitch-global-new']);

    expect(ids(globalCache.ffzGlobalBadges)).toEqual([
      'ffz-global-badge-cached',
    ]);

    expect(globalCache.lastUpdated).toBe(9000);

    expect(mockGetChannelEmotes).not.toHaveBeenCalled();

    expect(mockListTwitchChannelBadges).not.toHaveBeenCalled();

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache!.lastUpdated).toBe(3_650_000);
  });

  test('a cache clear during the cached-path global refresh fences the write-back', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 3_650_000,
        lastUpdated: 3_650_000,
        sevenTvEmoteSetId: 'cached-seven-set',
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      lastUpdated: 9000,
      sevenTvGlobalEmotes: [sevenTvEmote('seven-global-cached')],
      twitchGlobalBadges: [badge('twitch-global-badge-cached')],
    });

    let releaseFetch: (emotes: BttvSanitisedEmote[]) => void = () => {};

    mockGetBttvGlobalEmotes.mockReturnValue(
      new Promise<BttvSanitisedEmote[]>(resolve => {
        releaseFetch = resolve;
      }),
    );

    const load = loadChannelResources({ channelId });

    for (
      let tick = 0;
      tick < 50 && !mockGetBttvGlobalEmotes.mock.calls.length;
      tick += 1
    ) {
      await Promise.resolve();
    }

    expect(mockGetBttvGlobalEmotes).toHaveBeenCalledTimes(1);

    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    clearGlobalResourceCache();

    releaseFetch([bttvEmote('bttv-global-new', 'Global BTTV')]);
    await load;

    expect(chatStore$.persisted.globalCaches.peek()).toEqual(
      makeEmptyGlobalCacheData(),
    );
  });

  test('a full load writes the global slices to the shared slot only', async () => {
    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const globalCache = chatStore$.persisted.globalCaches.peek();
    expect(ids(globalCache.twitchGlobalEmotes)).toEqual(['twitch-global-new']);

    expect(ids(globalCache.bttvGlobalEmotes)).toEqual(['bttv-global-new']);

    expect(ids(globalCache.ffzGlobalEmotes)).toEqual(['ffz-global-new']);

    expect(ids(globalCache.ffzGlobalBadges)).toEqual(['ffz-global-badge-new']);

    expect(globalCache.lastUpdated).toBe(10_000);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect('twitchGlobalEmotes' in cache!).toBe(false);

    expect('ffzGlobalBadges' in cache!).toBe(false);
  });

  test('invalidating the resource caches stale-stamps the channel and drops memoised global fetches', async () => {
    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    expect(mockGetFfzGlobalEmotes).toHaveBeenCalledTimes(1);

    expect(mockListTwitchGlobalBadges).toHaveBeenCalledTimes(1);

    chatStore$.persisted.channelCaches.set({});
    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    expect(mockGetFfzGlobalEmotes).toHaveBeenCalledTimes(1);

    expect(mockListTwitchGlobalBadges).toHaveBeenCalledTimes(1);

    cheermoteFetchGuard.markFetched(channelId);

    invalidateChatResourceCaches(channelId);
    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect({
      badgesLastUpdated: cache!.badgesLastUpdated,
      lastUpdated: cache!.lastUpdated,
    }).toEqual({ badgesLastUpdated: 0, lastUpdated: 0 });

    expect(mockClearBttvBadgesCache).toHaveBeenCalledTimes(1);

    expect(cheermoteFetchGuard.hasFetched(channelId)).toBe(false);

    chatStore$.persisted.channelCaches.set({});
    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    expect(mockGetFfzGlobalEmotes).toHaveBeenCalledTimes(2);

    expect(mockListTwitchGlobalBadges).toHaveBeenCalledTimes(2);
  });

  test('fetches the personal emote set of the logged in user after a full load', async () => {
    mockGetPersonalEmoteSet.mockResolvedValue([sevenTvEmote('personal-emote')]);

    await expect(
      loadChannelResources({ channelId, forceRefresh: true, twitchUserId }),
    ).resolves.toBe(true);

    await new Promise(resolve => {
      setImmediate(resolve);
    });

    expect(mockGetPersonalEmoteSet).toHaveBeenCalledWith(twitchUserId);

    expect(ids(getUserPersonalEmotes(twitchUserId, channelId))).toEqual([
      'personal-emote',
    ]);
  });

  test('uses empty provider slices without crashing when provider requests reject with no cache', async () => {
    mockGetEmoteSetId.mockRejectedValue(new Error('TimeoutError'));
    mockGetSanitisedEmoteSet.mockRejectedValue(new Error('TimeoutError'));
    mockGetBttvGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetBttvChannelEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzChannelEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzChannelBadges.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache!.sevenTvChannelEmotes).toEqual([]);

    expect(cache!.bttvChannelEmotes).toEqual([]);

    expect(cache!.ffzChannelEmotes).toEqual([]);

    expect(cache!.ffzChannelBadges).toEqual([]);

    expect(cache!.twitchChannelEmotes).toEqual<SanitisedEmote[]>([
      twitchEmote('twitch-channel-new'),
    ]);

    // A first load with failed slices must stay stale-stamped so the next
    // join retries the holes instead of serving them for the cache duration.
    expect(cache!.lastUpdated).toBe(0);

    expect(cache!.badgesLastUpdated).toBe(0);

    const globalCache = chatStore$.persisted.globalCaches.peek();
    expect(globalCache.bttvGlobalEmotes).toEqual([]);

    expect(globalCache.ffzGlobalEmotes).toEqual([]);

    expect(globalCache.ffzGlobalBadges).toEqual([]);

    expect(globalCache.twitchGlobalEmotes).toEqual<SanitisedEmote[]>([
      twitchEmote('twitch-global-new', 'Twitch Global'),
    ]);

    expect(globalCache.lastUpdated).toBe(0);
  });

  test('posts a system message naming the providers whose fetch failed', async () => {
    clearMessages();

    mockGetBttvGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetBttvChannelEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');

    expect(systemMessages).toHaveLength(1);

    const text = systemMessages[0]!.message
      .flatMap(token => (token.type === 'text' ? [token.content] : []))
      .join('');

    expect(text).toContain('BTTV');

    expect(text).toContain('FFZ');

    expect(text).toContain("Couldn't load emotes and badges");

    expect(text).not.toContain('falling back');

    expect(text).not.toContain('Twitch');

    expect(text).not.toContain('7TV');
  });

  test('posts a fallback system message when failed providers still have cached slices', async () => {
    clearMessages();

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 2000,
        lastUpdated: 9000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [bttvEmote('bttv-global-cached', 'Global BTTV')],
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      lastUpdated: 9000,
    });

    mockGetBttvGlobalEmotes.mockRejectedValue(new Error('TimeoutError'));
    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(
      loadChannelResources({ channelId, forceRefresh: true, twitchUserId }),
    ).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');

    expect(systemMessages).toHaveLength(1);

    const text = systemMessages[0]!.message
      .flatMap(token => (token.type === 'text' ? [token.content] : []))
      .join('');

    expect(text).toContain('BTTV');

    expect(text).toContain('FFZ');

    expect(text).toContain('. Using cached ones.');
  });

  test('posts a system message when stale badge refresh requests reject', async () => {
    clearMessages();
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 0,
        lastUpdated: 9000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      lastUpdated: 9000,
    });

    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');

    expect(systemMessages).toHaveLength(1);

    const text = systemMessages[0]!.message
      .flatMap(token => (token.type === 'text' ? [token.content] : []))
      .join('');

    expect(text).toContain('FFZ');

    expect(text).toContain('. Using cached ones.');
  });

  test('posts no system message when every provider fetch succeeds', async () => {
    clearMessages();

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');

    expect(systemMessages).toEqual([]);
  });

  test('clearCache bumps cosmeticsCacheVersion so the emote loader refetches', () => {
    chatStore$.cosmeticsCacheVersion.set(3);

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        lastUpdated: 9000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    clearCache(channelId);

    expect(chatStore$.cosmeticsCacheVersion.peek()).toBe(4);

    expect(
      chatStore$.persisted.channelCaches.peek()[channelId],
    ).toBeUndefined();
  });
});

describe('resolveSubscriberChannelProfiles', () => {
  const profileUser = (id: string, displayName: string): UserInfoResponse => ({
    ...userInfoFixture,
    display_name: displayName,
    id,
    login: displayName.toLowerCase(),
    profile_image_url: `https://cdn.example.com/${id}.png`,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.persisted.channelCaches.set({});
    clearSubscriberProfilesCache();
  });

  test('resolves and stores profiles for owner ids without one', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: [
          { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
          { ...twitchEmote('emote2', 'Twitch Subscriber'), owner_id: '200' },
          twitchEmote('emote3', 'Twitch Subscriber'),
        ],
        twitchSubscriberChannelProfiles: {
          '200': {
            name: 'Cached',
            profileImageUrl: 'https://cdn.example.com/cached.png',
          },
        },
      },
    });

    mockGetUsersById.mockResolvedValue([profileUser('100', 'Zoil')]);

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).toHaveBeenCalledWith(['100']);
    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(cache!.twitchSubscriberChannelProfiles).toEqual<
      Record<string, SubscriberChannelProfile>
    >({
      '100': {
        name: 'Zoil',
        profileImageUrl: 'https://cdn.example.com/100.png',
      },
      '200': {
        name: 'Cached',
        profileImageUrl: 'https://cdn.example.com/cached.png',
      },
    });
  });

  test('skips the lookup when every owner id already has a profile', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: [
          { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
        ],
        twitchSubscriberChannelProfiles: {
          '100': {
            name: 'Zoil',
            profileImageUrl: 'https://cdn.example.com/100.png',
          },
        },
      },
    });

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).not.toHaveBeenCalled();
  });

  test('keeps existing profiles when the profile lookup fails', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: [
          { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
        ],
        twitchSubscriberChannelProfiles: {
          '200': {
            name: 'Cached',
            profileImageUrl: 'https://cdn.example.com/cached.png',
          },
        },
      },
    });

    mockGetUsersById.mockRejectedValue(new Error('TimeoutError'));

    await resolveSubscriberChannelProfiles(channelId);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(cache!.twitchSubscriberChannelProfiles).toEqual<
      Record<string, SubscriberChannelProfile>
    >({
      '200': {
        name: 'Cached',
        profileImageUrl: 'https://cdn.example.com/cached.png',
      },
    });
  });

  test('excludes non-numeric owner ids from the profile lookup', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: [
          { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: 'twitch' },
          { ...twitchEmote('emote2', 'Twitch Subscriber'), owner_id: '100' },
        ],
      },
    });

    mockGetUsersById.mockResolvedValue([profileUser('100', 'Zoil')]);

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).toHaveBeenCalledWith(['100']);
  });

  test('skips the lookup entirely when only sentinel owner ids exist', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: [
          { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: 'twitch' },
        ],
      },
    });

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).not.toHaveBeenCalled();
  });

  test('does not re-request owner ids Twitch never returned', async () => {
    const seedCache = () => {
      chatStore$.persisted.channelCaches.set({
        [channelId]: {
          ...makeEmptyEmoteData(),
          twitchSubscriberEmotes: [
            { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
          ],
        },
      });
    };

    seedCache();
    mockGetUsersById.mockResolvedValue([]);

    await resolveSubscriberChannelProfiles(channelId);
    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).toHaveBeenCalledTimes(1);
  });

  test('re-fetches attempted owner ids after the profiles cache is cleared', async () => {
    const seedCache = () => {
      chatStore$.persisted.channelCaches.set({
        [channelId]: {
          ...makeEmptyEmoteData(),
          twitchSubscriberEmotes: [
            { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
          ],
        },
      });
    };

    seedCache();
    mockGetUsersById.mockResolvedValue([profileUser('100', 'Zoil')]);

    await resolveSubscriberChannelProfiles(channelId);

    // Mirrors clearChatCosmeticsCache: the channel caches are emptied, so the
    // attempted-owner negative cache must be reset alongside them.
    seedCache();

    clearSubscriberProfilesCache();

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).toHaveBeenCalledTimes(2);

    expect(mockGetUsersById).toHaveBeenNthCalledWith(2, ['100']);
    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(cache!.twitchSubscriberChannelProfiles).toEqual<
      Record<string, SubscriberChannelProfile>
    >({
      '100': {
        name: 'Zoil',
        profileImageUrl: 'https://cdn.example.com/100.png',
      },
    });
  });

  test('clearing the cache during an in-flight lookup does not block a refetch', async () => {
    const seedCache = () => {
      chatStore$.persisted.channelCaches.set({
        [channelId]: {
          ...makeEmptyEmoteData(),
          twitchSubscriberEmotes: [
            { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
          ],
        },
      });
    };

    seedCache();

    let resolveLookup!: (users: ReturnType<typeof profileUser>[]) => void;

    mockGetUsersById.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveLookup = resolve;
        }),
    );

    const inFlight = resolveSubscriberChannelProfiles(channelId);

    // Mirrors clearChatCosmeticsCache while the lookup is still on the wire.
    chatStore$.persisted.channelCaches.set({});

    clearSubscriberProfilesCache();

    resolveLookup([profileUser('100', 'Zoil')]);
    await inFlight;

    seedCache();
    mockGetUsersById.mockResolvedValue([profileUser('100', 'Zoil')]);

    await resolveSubscriberChannelProfiles(channelId);

    expect(mockGetUsersById).toHaveBeenCalledTimes(2);
    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(cache!.twitchSubscriberChannelProfiles).toEqual<
      Record<string, SubscriberChannelProfile>
    >({
      '100': {
        name: 'Zoil',
        profileImageUrl: 'https://cdn.example.com/100.png',
      },
    });
  });

  test('an owner resolved in one channel is still resolved for another channel', async () => {
    const subscriberEmotes = [
      { ...twitchEmote('emote1', 'Twitch Subscriber'), owner_id: '100' },
    ];

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: subscriberEmotes,
      },
      '999': {
        ...makeEmptyEmoteData(),
        twitchSubscriberEmotes: subscriberEmotes,
      },
    });

    mockGetUsersById.mockResolvedValue([profileUser('100', 'Zoil')]);

    await resolveSubscriberChannelProfiles(channelId);
    await resolveSubscriberChannelProfiles('999');

    expect(mockGetUsersById).toHaveBeenCalledTimes(2);
    const cache = chatStore$.persisted.channelCaches.peek()['999'];

    expect(cache!.twitchSubscriberChannelProfiles).toEqual<
      Record<string, SubscriberChannelProfile>
    >({
      '100': {
        name: 'Zoil',
        profileImageUrl: 'https://cdn.example.com/100.png',
      },
    });
  });
});

describe('switchSevenTvEmoteSet', () => {
  const channelId = 'switch-channel';

  beforeEach(() => {
    jest.clearAllMocks();

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 1000,
        lastUpdated: 1000,
        sevenTvChannelEmotes: [sevenTvEmote('emote-a')],
        sevenTvEmoteSetId: 'set-a',
      },
    });
  });

  test('replaces the cached channel set with the new set', async () => {
    mockGetSanitisedEmoteSet.mockResolvedValue([sevenTvEmote('emote-b')]);

    await expect(switchSevenTvEmoteSet(channelId, 'set-b')).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache!.sevenTvEmoteSetId).toBe('set-b');

    expect(cache!.lastUpdated).toBe(1000);

    expect(ids(cache!.sevenTvChannelEmotes)).toEqual(['emote-b']);
  });

  test('no-ops when the cache already points at the requested set', async () => {
    await expect(switchSevenTvEmoteSet(channelId, 'set-a')).resolves.toBe(
      false,
    );

    expect(mockGetSanitisedEmoteSet).not.toHaveBeenCalled();
  });

  test('discards a stale fetch when a newer switch supersedes it', async () => {
    let resolveSetB!: (emotes: SevenTvSanitisedEmote[]) => void;

    const setBFetch = new Promise<SevenTvSanitisedEmote[]>(resolve => {
      resolveSetB = resolve;
    });

    mockGetSanitisedEmoteSet.mockImplementation(setId =>
      setId === 'set-b'
        ? setBFetch
        : Promise.resolve([sevenTvEmote('emote-c')]),
    );

    const switchToB = switchSevenTvEmoteSet(channelId, 'set-b');
    const switchToC = switchSevenTvEmoteSet(channelId, 'set-c');

    await expect(switchToC).resolves.toBe(true);
    resolveSetB([sevenTvEmote('emote-b')]);
    await expect(switchToB).resolves.toBe(false);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache!.sevenTvEmoteSetId).toBe('set-c');

    expect(ids(cache!.sevenTvChannelEmotes)).toEqual(['emote-c']);
  });
});

describe('updateSevenTvEmotes', () => {
  const channelId = 'live-update-channel';

  const seed = (channelEmotes: SevenTvSanitisedEmote[]) => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 1000,
        lastUpdated: 1000,
        sevenTvChannelEmotes: channelEmotes,
        sevenTvEmoteSetId: 'set-a',
      },
    });
  };

  const renamed = (id: string, name: string): SevenTvSanitisedEmote => ({
    ...sevenTvEmote(id),
    name,
    original_name: name,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('appends genuinely new emotes to the end of the set', () => {
    seed([sevenTvEmote('emote-a'), sevenTvEmote('emote-b')]);

    updateSevenTvEmotes(channelId, [sevenTvEmote('emote-c')], []);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(ids(cache!.sevenTvChannelEmotes)).toEqual([
      'emote-a',
      'emote-b',
      'emote-c',
    ]);
  });

  test('stamps only the 7TV freshness field, not the all-provider stamp', () => {
    jest.spyOn(Date, 'now').mockReturnValue(5000);
    seed([sevenTvEmote('emote-a')]);

    updateSevenTvEmotes(channelId, [sevenTvEmote('emote-b')], []);
    jest.spyOn(Date, 'now').mockRestore();

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect({
      lastUpdated: cache!.lastUpdated,
      sevenTvUpdatedAt: cache!.sevenTvUpdatedAt,
    }).toEqual({ lastUpdated: 1000, sevenTvUpdatedAt: 5000 });
  });

  test('removes pulled emotes while preserving the order of the rest', () => {
    seed([
      sevenTvEmote('emote-a'),
      sevenTvEmote('emote-b'),
      sevenTvEmote('emote-c'),
    ]);

    updateSevenTvEmotes(channelId, [], [sevenTvEmote('emote-b')]);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(ids(cache!.sevenTvChannelEmotes)).toEqual(['emote-a', 'emote-c']);
  });

  test('replaces a renamed emote in place instead of moving it to the end', () => {
    seed([
      sevenTvEmote('emote-a'),
      sevenTvEmote('emote-b'),
      sevenTvEmote('emote-c'),
    ]);

    // A rename arrives as a (removed old-id, added same-id) pair.
    updateSevenTvEmotes(
      channelId,
      [renamed('emote-b', 'emote-b-renamed')],
      [sevenTvEmote('emote-b')],
    );

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];

    expect(ids(cache!.sevenTvChannelEmotes)).toEqual([
      'emote-a',
      'emote-b',
      'emote-c',
    ]);

    expect(
      cache!.sevenTvChannelEmotes.find(emote => emote.id === 'emote-b')?.name,
    ).toBe('emote-b-renamed');
  });
});

afterEach(flushChatStoreTimers);
