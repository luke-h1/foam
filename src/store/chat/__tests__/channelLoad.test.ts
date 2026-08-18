import { EmoteSetKind } from '@app/graphql/generated/gql';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { twitchService } from '@app/services/twitch-service';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SanitisedEmote,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { UserInfoResponse } from '@app/types/twitch/user';
import * as GetBttvBadgesModule from '@app/utils/chat/bttvBadges/getBttvBadges';
import { cheermoteFetchGuard } from '@app/utils/chat/cheermoteStore/cheermoteFetchGuard';
import { logger } from '@app/utils/logger';

import {
  clearCache,
  clearPersonalEmotesCache,
  clearSubscriberProfilesCache,
  getUserPersonalEmotes,
  invalidateChatResourceCaches,
  loadChannelResources,
  resolveSubscriberChannelProfiles,
} from '../actions/channelLoad';
import { clearGlobalResourceCache } from '../actions/channelResources';
import { clearMessages } from '../actions/messages';
import {
  switchSevenTvEmoteSet,
  updateSevenTvEmotes,
} from '../actions/sevenTvChannelLifecycle';
import { chatStore$ } from '../observables/chatStore';
import type { SubscriberChannelProfile } from '../types/constants';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '../types/constants';

jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
jest.spyOn(logger.chat, 'info').mockImplementation(() => {});
jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});
jest.spyOn(logger.main, 'info').mockImplementation(() => {});
jest.spyOn(logger.stv, 'error').mockImplementation(() => {});
jest.spyOn(logger.stv, 'info').mockImplementation(() => {});
jest.spyOn(logger.stv, 'warn').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'debug').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'error').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'warn').mockImplementation(() => {});

// Isolates the resource loader from the BTTV global-badge micro-cache's own
// fetch/retry cascade, which is exercised by getBttvBadges' own spec.
const mockClearBttvBadgesCache = jest
  .spyOn(GetBttvBadgesModule, 'clearBttvBadgesCache')
  .mockImplementation(() => {});
jest.spyOn(GetBttvBadgesModule, 'getBttvBadges').mockReturnValue([]);

const mockGetEmoteSetId = jest.spyOn(sevenTvService, 'getEmoteSetId');
const mockGetSanitisedEmoteSet = jest.spyOn(
  sevenTvService,
  'getSanitisedEmoteSet',
);
const mockGet7tvUserId = jest.spyOn(sevenTvService, 'get7tvUserId');
const mockSendPresence = jest.spyOn(sevenTvService, 'sendPresence');
const mockGetChannelEmotes = jest.spyOn(twitchEmoteService, 'getChannelEmotes');
const mockGetGlobalEmotes = jest.spyOn(twitchEmoteService, 'getGlobalEmotes');
const mockGetSubscriberEmotes = jest.spyOn(
  twitchEmoteService,
  'getSubscriberEmotes',
);
const mockGetBttvGlobalEmotes = jest.spyOn(
  bttvEmoteService,
  'getSanitisedGlobalEmotes',
);
const mockGetBttvChannelEmotes = jest.spyOn(
  bttvEmoteService,
  'getSanitisedChannelEmotes',
);
const mockGetFfzChannelEmotes = jest.spyOn(
  ffzService,
  'getSanitisedChannelEmotes',
);
const mockGetFfzGlobalEmotes = jest.spyOn(
  ffzService,
  'getSanitisedGlobalEmotes',
);
const mockListTwitchChannelBadges = jest.spyOn(
  twitchBadgeService,
  'listSanitisedChannelBadges',
);
const mockListTwitchGlobalBadges = jest.spyOn(
  twitchBadgeService,
  'listSanitisedGlobalBadges',
);
const mockGetFfzChannelBadges = jest.spyOn(
  ffzService,
  'getSanitisedChannelBadges',
);
const mockGetFfzGlobalBadges = jest.spyOn(
  ffzService,
  'getSanitisedGlobalBadges',
);
const mockListChatterinoBadges = jest.spyOn(
  chatterinoService,
  'listSanitisedBadges',
);
const mockGetPersonalEmoteSet = jest.spyOn(
  sevenTvService,
  'getPersonalEmoteSet',
);
const mockGetUsersById = jest.spyOn(twitchService, 'getUsersById');
jest.spyOn(twitchService, 'getCheermotes').mockResolvedValue([]);

const channelId = 'channel-1';
const twitchUserId = 'user-1';

const sevenTvSetMetadata = {
  setId: 'test-set',
  setName: 'test',
  capacity: 100,
  ownerId: 'owner',
  kind: EmoteSetKind.Normal,
  updatedAt: '2025-01-01T00:00:00.000+00:00',
  totalCount: 1,
} satisfies SevenTvEmoteSetMetadata;

function sevenTvEmote(id: string): SevenTvSanitisedEmote {
  return {
    aspect_ratio: 1,
    creator: null,
    emote_link: `https://example.com/${id}`,
    flags: 0,
    format: 'webp',
    frame_count: 1,
    height: 32,
    id,
    name: id,
    original_name: id,
    set_metadata: sevenTvSetMetadata,
    site: '7TV Channel',
    provider: '7tv',
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
    width: 32,
    zero_width: false,
  };
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
    'Twitch Channel' | 'Twitch Global' | 'Twitch Subscriber' = 'Twitch Channel',
): TwitchSanitisedEmote {
  return {
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    provider: 'twitch',
    site,
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  };
}

function badge(id: string): SanitisedBadgeSet {
  return {
    id,
    set: id,
    title: id,
    type: 'FFZ Badge',
    provider: 'ffz',
    url: `https://example.com/${id}.png`,
  };
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
    // Scoped restore, not jest.restoreAllMocks(): the service methods above
    // are spied at module scope for the whole file, and restoreAllMocks()
    // would revert them to their real (network-calling) implementations for
    // every later describe in this file too.
    jest.spyOn(Date, 'now').mockRestore();
  });

  test('keeps cached provider slices when full refresh provider requests reject', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 2_000,
        bttvChannelEmotes: [bttvEmote('bttv-channel-cached')],
        ffzChannelBadges: [badge('ffz-channel-badge-cached')],
        ffzChannelEmotes: [ffzEmote('ffz-channel-cached')],
        lastUpdated: 1_000,
        sevenTvChannelEmotes: [sevenTvEmote('seven-channel-cached')],
        sevenTvEmoteSetId: 'cached-seven-set',
      },
    });
    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [bttvEmote('bttv-global-cached', 'Global BTTV')],
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      ffzGlobalEmotes: [ffzEmote('ffz-global-cached', 'Global FFZ')],
      lastUpdated: 1_000,
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
    expect(cache).toBeDefined();

    expect(sevenTvService.getSanitisedEmoteSet).toHaveBeenCalledWith(
      'cached-seven-set',
    );
    expect(ids(cache!.sevenTvChannelEmotes)).toEqual(['seven-channel-cached']);
    expect(cache!.bttvChannelEmotes).toEqual([]);
    expect(ids(cache!.ffzChannelEmotes)).toEqual(['ffz-channel-cached']);
    expect(ids(cache!.ffzChannelBadges)).toEqual(['ffz-channel-badge-cached']);
    expect(cache!.lastUpdated).toBe(1_000);
    expect(cache!.badgesLastUpdated).toBe(2_000);

    const globalCache = chatStore$.persisted.globalCaches.peek();
    expect(ids(globalCache.bttvGlobalEmotes)).toEqual(['bttv-global-cached']);
    expect(ids(globalCache.ffzGlobalEmotes)).toEqual(['ffz-global-cached']);
    expect(ids(globalCache.ffzGlobalBadges)).toEqual([
      'ffz-global-badge-cached',
    ]);
    expect(ids(globalCache.twitchGlobalEmotes)).toEqual(['twitch-global-new']);
    expect(globalCache.lastUpdated).toBe(1_000);
  });

  test('keeps cached badge slices when stale badge refresh requests reject', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 9_000,
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
    });

    mockGetFfzChannelBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache).toBeDefined();

    expect(mockListTwitchChannelBadges).toHaveBeenCalledTimes(1);
    expect(ids(cache!.ffzChannelBadges)).toEqual(['ffz-channel-badge-cached']);
    expect(cache!.badgesLastUpdated).toBe(9_000);
    expect(cache!.lastUpdated).toBe(3_650_000);
    expect(mockGetFfzGlobalBadges).not.toHaveBeenCalled();
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
      lastUpdated: 9_000,
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
    expect(globalCache.lastUpdated).toBe(9_000);
    expect(mockGetChannelEmotes).not.toHaveBeenCalled();
    expect(mockListTwitchChannelBadges).not.toHaveBeenCalled();

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache!.lastUpdated).toBe(3_650_000);
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
    expect(cache).toBeDefined();
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
    expect(cache).toBeDefined();
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
      .flatMap(part => (part.type === 'text' ? [part.content] : []))
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
        badgesLastUpdated: 2_000,
        lastUpdated: 9_000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });
    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [bttvEmote('bttv-global-cached', 'Global BTTV')],
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      lastUpdated: 9_000,
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
      .flatMap(part => (part.type === 'text' ? [part.content] : []))
      .join('');
    expect(text).toContain('BTTV');
    expect(text).toContain('FFZ');
    expect(text).toContain('falling back to cached emotes/badges');
  });

  test('posts a system message when stale badge refresh requests reject', async () => {
    clearMessages();
    jest.spyOn(Date, 'now').mockReturnValue(3_700_000);
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        badgesLastUpdated: 0,
        lastUpdated: 9_000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });
    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      ffzGlobalBadges: [badge('ffz-global-badge-cached')],
      lastUpdated: 9_000,
    });

    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');
    expect(systemMessages).toHaveLength(1);

    const text = systemMessages[0]!.message
      .flatMap(part => (part.type === 'text' ? [part.content] : []))
      .join('');
    expect(text).toContain('FFZ');
    expect(text).toContain('falling back to cached emotes/badges');
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
        lastUpdated: 9_000,
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
    broadcaster_type: '',
    created_at: '',
    description: '',
    display_name: displayName,
    id,
    login: displayName.toLowerCase(),
    offline_image_url: '',
    profile_image_url: `https://cdn.example.com/${id}.png`,
    type: '',
    view_count: 0,
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
        badgesLastUpdated: 1_000,
        lastUpdated: 1_000,
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
        badgesLastUpdated: 1_000,
        lastUpdated: 1_000,
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
