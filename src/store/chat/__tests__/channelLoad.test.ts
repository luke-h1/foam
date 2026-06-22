import { EmoteSetKind } from '@app/graphql/generated/gql';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SevenTvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';

import { loadChannelResources } from '../actions/channelLoad';
import { chatStore$ } from '../observables/chatStore';
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
    getSanitisedEmoteSet: jest.fn(),
    sendPresence: jest.fn(),
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
};

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
    | 'Twitch Channel'
    | 'Twitch Global'
    | 'Twitch Subscriber' = 'Twitch Channel',
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
    expect(cache!.emotes).toEqual([
      twitchEmote('twitch-channel-new'),
      twitchEmote('twitch-global-new', 'Twitch Global'),
    ]);
    expect(cache!.lastUpdated).toBe(10_000);
    expect(cache!.badgesLastUpdated).toBe(10_000);
  });
});
