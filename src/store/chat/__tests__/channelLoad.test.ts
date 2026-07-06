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

import {
  clearPersonalEmotesCache,
  clearSubscriberProfilesCache,
  loadChannelResources,
  resolveSubscriberChannelProfiles,
  switchSevenTvEmoteSet,
  updateSevenTvEmotes,
} from '../actions/channelLoad';
import { clearGlobalResourceCache } from '../actions/channelResources';
import { chatStore$ } from '../observables/chatStore';
import type { SubscriberChannelProfile } from '../types/constants';
import { emptyEmoteData } from '../types/constants';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

jest.mock('@app/lib/sentry', () => ({
  startSpanAsync: jest.fn(
    async (_name: string, _op: string, fn: () => Promise<unknown>) => fn(),
  ),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    main: {
      info: jest.fn(),
    },
    stv: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    stvWs: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

jest.mock('@app/services/bttv-emote-service', () => ({
  bttvEmoteService: {
    getSanitisedChannelEmotes: jest.fn(),
    getSanitisedGlobalEmotes: jest.fn(),
  },
}));

jest.mock('@app/services/chatterino-service', () => ({
  chatterinoService: {
    listSanitisedBadges: jest.fn(),
  },
}));

jest.mock('@app/services/ffz-service', () => ({
  ffzService: {
    getSanitisedChannelBadges: jest.fn(),
    getSanitisedChannelEmotes: jest.fn(),
    getSanitisedGlobalBadges: jest.fn(),
    getSanitisedGlobalEmotes: jest.fn(),
  },
}));

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn(),
    getEmoteSetId: jest.fn(),
    getPersonalEmoteSet: jest.fn(),
    getSanitisedEmoteSet: jest.fn(),
    sendPresence: jest.fn(),
  },
}));

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getCheermotes: jest.fn().mockResolvedValue([]),
    getUsersById: jest.fn(),
  },
}));

jest.mock('@app/services/twitch-badge-service', () => ({
  twitchBadgeService: {
    listSanitisedChannelBadges: jest.fn(),
    listSanitisedGlobalBadges: jest.fn(),
  },
}));

jest.mock('@app/services/twitch-emote-service', () => ({
  twitchEmoteService: {
    getChannelEmotes: jest.fn(),
    getGlobalEmotes: jest.fn(),
    getSubscriberEmotes: jest.fn(),
  },
}));

const mockGetEmoteSetId = jest.mocked(sevenTvService.getEmoteSetId);
const mockGetSanitisedEmoteSet = jest.mocked(
  sevenTvService.getSanitisedEmoteSet,
);
const mockGet7tvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockSendPresence = jest.mocked(sevenTvService.sendPresence);
const mockGetChannelEmotes = jest.mocked(twitchEmoteService.getChannelEmotes);
const mockGetGlobalEmotes = jest.mocked(twitchEmoteService.getGlobalEmotes);
const mockGetSubscriberEmotes = jest.mocked(
  twitchEmoteService.getSubscriberEmotes,
);
const mockGetBttvGlobalEmotes = jest.mocked(
  bttvEmoteService.getSanitisedGlobalEmotes,
);
const mockGetBttvChannelEmotes = jest.mocked(
  bttvEmoteService.getSanitisedChannelEmotes,
);
const mockGetFfzChannelEmotes = jest.mocked(
  ffzService.getSanitisedChannelEmotes,
);
const mockGetFfzGlobalEmotes = jest.mocked(ffzService.getSanitisedGlobalEmotes);
const mockListTwitchChannelBadges = jest.mocked(
  twitchBadgeService.listSanitisedChannelBadges,
);
const mockListTwitchGlobalBadges = jest.mocked(
  twitchBadgeService.listSanitisedGlobalBadges,
);
const mockGetFfzChannelBadges = jest.mocked(
  ffzService.getSanitisedChannelBadges,
);
const mockGetFfzGlobalBadges = jest.mocked(ffzService.getSanitisedGlobalBadges);
const mockListChatterinoBadges = jest.mocked(
  chatterinoService.listSanitisedBadges,
);
const mockGetPersonalEmoteSet = jest.mocked(sevenTvService.getPersonalEmoteSet);
const mockGetUsersById = jest.mocked(twitchService.getUsersById);

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
    jest.restoreAllMocks();
  });

  test('keeps cached provider slices when full refresh provider requests reject', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...emptyEmoteData,
        badges: [badge('ffz-global-badge-cached')],
        badgesLastUpdated: 2_000,
        bttvChannelEmotes: [bttvEmote('bttv-channel-cached')],
        bttvGlobalEmotes: [bttvEmote('bttv-global-cached', 'Global BTTV')],
        emotes: [
          sevenTvEmote('seven-channel-cached'),
          bttvEmote('bttv-global-cached', 'Global BTTV'),
          bttvEmote('bttv-channel-cached'),
          ffzEmote('ffz-channel-cached'),
          ffzEmote('ffz-global-cached', 'Global FFZ'),
        ],
        ffzChannelBadges: [badge('ffz-channel-badge-cached')],
        ffzChannelEmotes: [ffzEmote('ffz-channel-cached')],
        ffzGlobalBadges: [badge('ffz-global-badge-cached')],
        ffzGlobalEmotes: [ffzEmote('ffz-global-cached', 'Global FFZ')],
        lastUpdated: 1_000,
        sevenTvChannelEmotes: [sevenTvEmote('seven-channel-cached')],
        sevenTvEmoteSetId: 'cached-seven-set',
      },
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
    expect(ids(cache!.bttvGlobalEmotes)).toEqual(['bttv-global-cached']);
    expect(cache!.bttvChannelEmotes).toEqual([]);
    expect(ids(cache!.ffzChannelEmotes)).toEqual(['ffz-channel-cached']);
    expect(ids(cache!.ffzGlobalEmotes)).toEqual(['ffz-global-cached']);
    expect(ids(cache!.ffzChannelBadges)).toEqual(['ffz-channel-badge-cached']);
    expect(ids(cache!.ffzGlobalBadges)).toEqual(['ffz-global-badge-cached']);
    expect(ids(cache!.emotes)).toContain('bttv-global-cached');
    expect(ids(cache!.emotes)).not.toContain('bttv-channel-cached');
    expect(cache!.lastUpdated).toBe(1_000);
    expect(cache!.badgesLastUpdated).toBe(2_000);
  });

  test('keeps cached badge slices when stale badge refresh requests reject', async () => {
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...emptyEmoteData,
        badges: [badge('ffz-global-badge-cached')],
        badgesLastUpdated: 0,
        emotes: [twitchEmote('existing-emote')],
        ffzGlobalBadges: [badge('ffz-global-badge-cached')],
        lastUpdated: 9_000,
        twitchChannelEmotes: [twitchEmote('existing-emote')],
      },
    });

    mockGetFfzGlobalBadges.mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache).toBeDefined();

    expect(ids(cache!.ffzGlobalBadges)).toEqual(['ffz-global-badge-cached']);
    expect(ids(cache!.badges)).toEqual(['ffz-global-badge-cached']);
    expect(cache!.badgesLastUpdated).toBe(0);
    expect(cache!.lastUpdated).toBe(9_000);
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
    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(ids(cache!.sevenTvPersonalEmotes[twitchUserId] ?? [])).toEqual([
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
    expect(cache!.bttvGlobalEmotes).toEqual([]);
    expect(cache!.bttvChannelEmotes).toEqual([]);
    expect(cache!.ffzChannelEmotes).toEqual([]);
    expect(cache!.ffzGlobalEmotes).toEqual([]);
    expect(cache!.ffzChannelBadges).toEqual([]);
    expect(cache!.ffzGlobalBadges).toEqual([]);
    expect(cache!.emotes).toEqual<SanitisedEmote[]>([
      twitchEmote('twitch-channel-new'),
      twitchEmote('twitch-global-new', 'Twitch Global'),
    ]);
    // A first load with failed slices must stay stale-stamped so the next
    // join retries the holes instead of serving them for the cache duration.
    expect(cache!.lastUpdated).toBe(0);
    expect(cache!.badgesLastUpdated).toBe(0);
  });

  test('posts a system message naming the providers whose fetch failed', async () => {
    chatStore$.messages.set([]);

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
    expect(text).toContain('falling back to cached emotes/badges');
    expect(text).not.toContain('Twitch');
    expect(text).not.toContain('7TV');
  });

  test('posts no system message when every provider fetch succeeds', async () => {
    chatStore$.messages.set([]);

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const systemMessages = chatStore$.messages
      .peek()
      .filter(message => message.sender === 'System');
    expect(systemMessages).toEqual([]);
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
        ...emptyEmoteData,
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
        ...emptyEmoteData,
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
        ...emptyEmoteData,
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
        ...emptyEmoteData,
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
        ...emptyEmoteData,
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
          ...emptyEmoteData,
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
          ...emptyEmoteData,
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
          ...emptyEmoteData,
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
        ...emptyEmoteData,
        twitchSubscriberEmotes: subscriberEmotes,
      },
      '999': {
        ...emptyEmoteData,
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
        ...emptyEmoteData,
        badges: [],
        badgesLastUpdated: 1_000,
        emotes: [sevenTvEmote('emote-a')],
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
    expect(ids(cache!.emotes)).toEqual(['emote-b']);
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
        ...emptyEmoteData,
        badges: [],
        badgesLastUpdated: 1_000,
        emotes: channelEmotes,
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
