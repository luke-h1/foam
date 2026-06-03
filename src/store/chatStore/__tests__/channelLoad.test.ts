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

    jest.mocked(sevenTvService.getEmoteSetId).mockResolvedValue('seven-set');
    jest
      .mocked(sevenTvService.getSanitisedEmoteSet)
      .mockImplementation(id =>
        Promise.resolve(
          asProviderEmotes<typeof sevenTvService.getSanitisedEmoteSet>([
            emote(`seven-${id}`),
          ]),
        ),
      );
    jest.mocked(sevenTvService.get7tvUserId).mockResolvedValue('');
    jest.mocked(sevenTvService.sendPresence).mockResolvedValue(undefined);
    jest
      .mocked(twitchEmoteService.getChannelEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof twitchEmoteService.getChannelEmotes>([
          emote('twitch-channel-new'),
        ]),
      );
    jest
      .mocked(twitchEmoteService.getGlobalEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof twitchEmoteService.getGlobalEmotes>([
          emote('twitch-global-new'),
        ]),
      );
    jest.mocked(twitchEmoteService.getSubscriberEmotes).mockResolvedValue([]);
    jest
      .mocked(bttvEmoteService.getSanitisedGlobalEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof bttvEmoteService.getSanitisedGlobalEmotes>([
          emote('bttv-global-new'),
        ]),
      );
    jest
      .mocked(bttvEmoteService.getSanitisedChannelEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof bttvEmoteService.getSanitisedChannelEmotes>([
          emote('bttv-channel-new'),
        ]),
      );
    jest
      .mocked(ffzService.getSanitisedChannelEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof ffzService.getSanitisedChannelEmotes>([
          emote('ffz-channel-new'),
        ]),
      );
    jest
      .mocked(ffzService.getSanitisedGlobalEmotes)
      .mockResolvedValue(
        asProviderEmotes<typeof ffzService.getSanitisedGlobalEmotes>([
          emote('ffz-global-new'),
        ]),
      );
    jest
      .mocked(twitchBadgeService.listSanitisedChannelBadges)
      .mockResolvedValue([]);
    jest
      .mocked(twitchBadgeService.listSanitisedGlobalBadges)
      .mockResolvedValue([]);
    jest
      .mocked(ffzService.getSanitisedChannelBadges)
      .mockResolvedValue([badge('ffz-channel-badge-new')]);
    jest
      .mocked(ffzService.getSanitisedGlobalBadges)
      .mockResolvedValue([badge('ffz-global-badge-new')]);
    jest.mocked(chatterinoService.listSanitisedBadges).mockReturnValue([]);
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

    jest
      .mocked(sevenTvService.getEmoteSetId)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(sevenTvService.getSanitisedEmoteSet)
      .mockImplementation(id =>
        id === 'cached-seven-set'
          ? Promise.reject(new Error('TimeoutError'))
          : Promise.resolve(
              asProviderEmotes<typeof sevenTvService.getSanitisedEmoteSet>([
                emote(`seven-${id}-new`),
              ]),
            ),
      );
    jest
      .mocked(bttvEmoteService.getSanitisedGlobalEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(bttvEmoteService.getSanitisedChannelEmotes)
      .mockResolvedValue([]);
    jest
      .mocked(ffzService.getSanitisedChannelEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedGlobalEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedChannelBadges)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedGlobalBadges)
      .mockRejectedValue(new Error('TimeoutError'));

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

    jest
      .mocked(ffzService.getSanitisedGlobalBadges)
      .mockRejectedValue(new Error('TimeoutError'));

    await expect(loadChannelResources({ channelId })).resolves.toBe(true);

    const cache = chatStore$.persisted.channelCaches.peek()[channelId];
    expect(cache).toBeDefined();

    expect(ids(cache!.ffzGlobalBadges)).toEqual(['ffz-global-badge-cached']);
    expect(ids(cache!.badges)).toEqual(['ffz-global-badge-cached']);
    expect(cache!.badgesLastUpdated).toBe(0);
    expect(cache!.lastUpdated).toBe(9_000);
  });

  test('uses empty provider slices without crashing when provider requests reject with no cache', async () => {
    jest
      .mocked(sevenTvService.getEmoteSetId)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(sevenTvService.getSanitisedEmoteSet)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(bttvEmoteService.getSanitisedGlobalEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(bttvEmoteService.getSanitisedChannelEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedChannelEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedGlobalEmotes)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedChannelBadges)
      .mockRejectedValue(new Error('TimeoutError'));
    jest
      .mocked(ffzService.getSanitisedGlobalBadges)
      .mockRejectedValue(new Error('TimeoutError'));

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
