import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { SanitisedEmote } from '@app/types/emote';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';

import { emptyEmoteData } from '../constants';
import { loadChannelResources } from '../channelLoad';
import { chatStore$ } from '../state';

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
  recordError: jest.fn(),
  recordInfo: jest.fn(),
  recordWarning: jest.fn(),
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

function emote(id: string): SanitisedEmote {
  return {
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    site: 'BTTV',
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

const asProviderEmotes = <T extends (...args: never[]) => Promise<unknown>>(
  items: SanitisedEmote[],
): Awaited<ReturnType<T>> => items as unknown as Awaited<ReturnType<T>>;

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
      Promise.resolve(
        asProviderEmotes<typeof sevenTvService.getSanitisedEmoteSet>([
          emote(`seven-${id}`),
        ]),
      ),
    );
    mockGet7tvUserId.mockResolvedValue('');
    mockSendPresence.mockResolvedValue(undefined);
    mockGetChannelEmotes.mockResolvedValue(
      asProviderEmotes<typeof twitchEmoteService.getChannelEmotes>([
        emote('twitch-channel-new'),
      ]),
    );
    mockGetGlobalEmotes.mockResolvedValue(
      asProviderEmotes<typeof twitchEmoteService.getGlobalEmotes>([
        emote('twitch-global-new'),
      ]),
    );
    mockGetSubscriberEmotes.mockResolvedValue([]);
    mockGetBttvGlobalEmotes.mockResolvedValue(
      asProviderEmotes<typeof bttvEmoteService.getSanitisedGlobalEmotes>([
        emote('bttv-global-new'),
      ]),
    );
    mockGetBttvChannelEmotes.mockResolvedValue(
      asProviderEmotes<typeof bttvEmoteService.getSanitisedChannelEmotes>([
        emote('bttv-channel-new'),
      ]),
    );
    mockGetFfzChannelEmotes.mockResolvedValue(
      asProviderEmotes<typeof ffzService.getSanitisedChannelEmotes>([
        emote('ffz-channel-new'),
      ]),
    );
    mockGetFfzGlobalEmotes.mockResolvedValue(
      asProviderEmotes<typeof ffzService.getSanitisedGlobalEmotes>([
        emote('ffz-global-new'),
      ]),
    );
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
        bttvChannelEmotes: [emote('bttv-channel-cached')],
        bttvGlobalEmotes: [emote('bttv-global-cached')],
        emotes: [
          emote('seven-channel-cached'),
          emote('bttv-global-cached'),
          emote('bttv-channel-cached'),
          emote('ffz-channel-cached'),
          emote('ffz-global-cached'),
        ],
        ffzChannelBadges: [badge('ffz-channel-badge-cached')],
        ffzChannelEmotes: [emote('ffz-channel-cached')],
        ffzGlobalBadges: [badge('ffz-global-badge-cached')],
        ffzGlobalEmotes: [emote('ffz-global-cached')],
        lastUpdated: 1_000,
        sevenTvChannelEmotes: [emote('seven-channel-cached')],
        sevenTvEmoteSetId: 'cached-seven-set',
      },
    });

    mockGetEmoteSetId.mockRejectedValue(new Error('TimeoutError'));
    mockGetSanitisedEmoteSet.mockImplementation(id =>
      id === 'cached-seven-set'
        ? Promise.reject(new Error('TimeoutError'))
        : Promise.resolve(
            asProviderEmotes<typeof sevenTvService.getSanitisedEmoteSet>([
              emote(`seven-${id}-new`),
            ]),
          ),
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
        emotes: [emote('existing-emote')],
        ffzGlobalBadges: [badge('ffz-global-badge-cached')],
        lastUpdated: 9_000,
        twitchChannelEmotes: [emote('existing-emote')],
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
      emote('twitch-channel-new'),
      emote('twitch-global-new'),
    ]);
    expect(cache!.lastUpdated).toBe(10_000);
    expect(cache!.badgesLastUpdated).toBe(10_000);
  });
});
