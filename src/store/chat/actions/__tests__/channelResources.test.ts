import type { ChannelCacheType } from '@app/store/chat/types/constants';
import { emptyEmoteData } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';

import {
  buildBadgeResourceSpecs,
  buildEmoteResourceSpecs,
  type EmoteCacheKey,
  type EmoteResourceSpec,
  reconcileSettledSpecs,
  reportResourceResults,
  ResourceFetchTimeoutError,
  type SettledSpec,
  settleSpecs,
} from '../channelResources';

jest.mock('@app/services/bttv-emote-service', () => ({ bttvEmoteService: {} }));
jest.mock('@app/services/chatterino-service', () => ({
  chatterinoService: {},
}));
jest.mock('@app/services/ffz-service', () => ({ ffzService: {} }));
jest.mock('@app/services/seventv-service', () => ({ sevenTvService: {} }));
jest.mock('@app/services/twitch-badge-service', () => ({
  twitchBadgeService: {},
}));
jest.mock('@app/services/twitch-emote-service', () => ({
  twitchEmoteService: {},
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const channelId = 'channel-1';

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

function spec(key: EmoteResourceSpec['key']): EmoteResourceSpec {
  return {
    key,
    name: key,
    label: key,
    provider: 'bttv',
    resourceType: 'emotes',
    scope: 'channel',
    warningName: 'bttv_emotes_warning',
    fetch: () => Promise.resolve([]),
  };
}

describe('buildEmoteResourceSpecs', () => {
  test('produces one ordered spec per provider slice with matching cache keys', () => {
    const specs = buildEmoteResourceSpecs({
      channelId,
      sevenTvSetId: 'set-1',
      twitchUserId: 'user-1',
    });

    expect(specs.map(s => s.key)).toEqual([
      'sevenTvChannelEmotes',
      'sevenTvGlobalEmotes',
      'twitchChannelEmotes',
      'twitchGlobalEmotes',
      'twitchSubscriberEmotes',
      'bttvGlobalEmotes',
      'bttvChannelEmotes',
      'ffzChannelEmotes',
      'ffzGlobalEmotes',
    ]);
  });
});

describe('buildBadgeResourceSpecs', () => {
  test('produces one ordered spec per badge slice', () => {
    const specs = buildBadgeResourceSpecs({ channelId });

    expect(specs.map(s => s.key)).toEqual([
      'twitchChannelBadges',
      'twitchGlobalBadges',
      'ffzGlobalBadges',
      'ffzChannelBadges',
      'chatterinoBadges',
    ]);
  });
});

describe('settleSpecs', () => {
  test('zips each spec with its settled result in order', async () => {
    const fulfilled = spec('twitchChannelEmotes');
    fulfilled.fetch = () => Promise.resolve([emote('a')]);
    const rejected = spec('twitchGlobalEmotes');
    rejected.fetch = () => Promise.reject(new Error('boom'));

    const settled = await settleSpecs([fulfilled, rejected]);

    expect(settled.map(entry => entry.spec.key)).toEqual([
      'twitchChannelEmotes',
      'twitchGlobalEmotes',
    ]);
    expect(settled[0]!.result).toEqual({
      status: 'fulfilled',
      value: [emote('a')],
    });
    expect(settled[1]!.result.status).toBe('rejected');
  });

  describe('per-provider timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('rejects a spec whose fetch exceeds the timeout while fast specs stay fulfilled', async () => {
      const fast = spec('twitchChannelEmotes');
      fast.fetch = () => Promise.resolve([emote('a')]);
      const slow = spec('twitchGlobalEmotes');
      slow.fetch = () => new Promise<SanitisedEmote[]>(() => {});

      const settledPromise = settleSpecs([fast, slow], 1000);
      await jest.advanceTimersByTimeAsync(1000);
      const settled = await settledPromise;

      expect(settled[0]!.result).toEqual({
        status: 'fulfilled',
        value: [emote('a')],
      });
      expect(settled[1]!.result.status).toBe('rejected');
      expect(
        (settled[1]!.result as PromiseRejectedResult).reason,
      ).toBeInstanceOf(ResourceFetchTimeoutError);
    });

    test('does not time out a fetch that resolves before the deadline', async () => {
      const within = spec('twitchChannelEmotes');
      within.fetch = () =>
        new Promise<SanitisedEmote[]>(resolve => {
          setTimeout(() => resolve([emote('b')]), 500);
        });

      const settledPromise = settleSpecs([within], 1000);
      await jest.advanceTimersByTimeAsync(500);
      const settled = await settledPromise;

      expect(settled[0]!.result).toEqual({
        status: 'fulfilled',
        value: [emote('b')],
      });
    });
  });
});

describe('reconcileSettledSpecs', () => {
  const existingCache: ChannelCacheType = {
    ...emptyEmoteData,
    twitchChannelEmotes: [emote('cached')],
  };

  test('deduplicates fulfilled results by id', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: {
          status: 'fulfilled',
          value: [emote('a'), emote('a'), emote('b')],
        },
      },
    ];

    const reconciled = reconcileSettledSpecs(settled, {
      channelId,
      existingCache: undefined,
    });

    expect(reconciled.get('twitchChannelEmotes')).toEqual<SanitisedEmote[]>([
      emote('a'),
      emote('b'),
    ]);
  });

  test('falls back to the cached slice when a fetch rejects', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    const reconciled = reconcileSettledSpecs(settled, {
      channelId,
      existingCache,
    });

    expect(reconciled.get('twitchChannelEmotes')).toEqual<SanitisedEmote[]>([
      emote('cached'),
    ]);
  });

  test('yields an empty slice when a fetch rejects with no cache', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    const reconciled = reconcileSettledSpecs(settled, {
      channelId,
      existingCache: undefined,
    });

    expect(reconciled.get('twitchChannelEmotes')).toEqual([]);
  });
});

describe('reportResourceResults', () => {
  beforeEach(() => {
    jest.mocked(logger.chat.warn).mockClear();
    jest.mocked(logger.chat.info).mockClear();
  });

  test('warns once per rejected resource and counts every resource', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'fulfilled', value: [emote('a')] },
      },
      {
        spec: spec('twitchGlobalEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    reportResourceResults({
      channelId,
      settled,
      trigger: 'unit_test',
    });

    expect(logger.chat.warn).toHaveBeenCalledTimes(1);
    expect(logger.chat.info).toHaveBeenCalledTimes(1);
  });
});
