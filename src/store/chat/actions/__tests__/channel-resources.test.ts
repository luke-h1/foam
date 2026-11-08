import { ApiError } from '@app/services/api/client';
import type {
  ChannelCacheType,
  GlobalCacheType,
} from '@app/store/chat/types/constants';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';

import {
  collectFailedProviderReasons,
  defineResourceSpec,
  describeProviderFailureReason,
  type EmoteCacheKey,
  type EmoteResourceSpec,
  hadCachedResourcesForFailedSpecs,
  reconcileSettledSpecs,
  reportResourceResults,
  ResourceFetchTimeoutError,
  type SettledSpec,
  settleSpecs,
} from '../channel-resources';

const channelId = 'channel-1';

function emote(id: string): SanitisedEmote {
  return {
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    site: 'BTTV',
    provider: 'bttv',
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  };
}

function spec(key: EmoteResourceSpec['key']): EmoteResourceSpec {
  return defineResourceSpec({
    key,
    name: key,
    label: key,
    warningName: 'bttv_emotes_warning',
    fetch: () => Promise.resolve([]),
  });
}

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

    expect(settled[1]!.result).toEqual({
      status: 'rejected',
      reason: new Error('boom'),
    });
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

      expect(settled[1]!.result).toEqual({
        status: 'rejected',
        reason: new ResourceFetchTimeoutError('twitchGlobalEmotes', 1000),
      });
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
    ...makeEmptyEmoteData(),
    twitchChannelEmotes: [emote('cached')],
  };

  const existingGlobalCache: GlobalCacheType = {
    ...makeEmptyGlobalCacheData(),
    bttvGlobalEmotes: [emote('cached-global')],
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
      existingGlobalCache: undefined,
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
      existingGlobalCache,
    });

    expect(reconciled.get('twitchChannelEmotes')).toEqual<SanitisedEmote[]>([
      emote('cached'),
    ]);
  });

  test('falls back to the global slot for a rejected global-scope spec', () => {
    const globalSpec = spec('bttvGlobalEmotes');

    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: globalSpec,
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    const reconciled = reconcileSettledSpecs(settled, {
      channelId,
      existingCache,
      existingGlobalCache,
    });

    expect(reconciled.get('bttvGlobalEmotes')).toEqual<SanitisedEmote[]>([
      emote('cached-global'),
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
      existingGlobalCache: undefined,
    });

    expect(reconciled.get('twitchChannelEmotes')).toEqual([]);
  });
});

describe('reportResourceResults', () => {
  const warn = jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});
  const info = jest.spyOn(logger.chat, 'info').mockImplementation(() => {});

  beforeEach(() => {
    warn.mockClear();
    info.mockClear();
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

    expect(warn.mock.calls).toEqual([
      [
        'Failed to load twitchGlobalEmotes',
        {
          name: 'bttv_emotes_warning',
          error: new Error('boom'),
          action: 'provider_resource_failed',
          channel_id: channelId,
          provider: 'twitch',
          resource_name: 'twitchGlobalEmotes',
          resource_type: 'emotes',
          scope: 'global',
          screen: 'chat',
          trigger: 'unit_test',
        },
      ],
    ]);

    expect(info.mock.calls).toEqual([
      [
        'Provider resources settled',
        {
          name: 'chat_resources_info',
          action: 'provider_resources_settled',
          channel_id: channelId,
          failed_resources: 1,
          screen: 'chat',
          total_resources: 2,
          trigger: 'unit_test',
          twitchChannelEmotes_count: 1,
          twitchGlobalEmotes_count: 0,
        },
      ],
    ]);
  });
});

describe('reportResourceResults with client errors', () => {
  const warn = jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    warn.mockClear();
  });

  test('does not warn again for an API error the client already logged', () => {
    reportResourceResults({
      channelId,
      settled: [
        {
          spec: spec('bttvChannelEmotes'),
          result: { status: 'rejected', reason: new ApiError('nope', 500) },
        },
      ],
      trigger: 'unit_test',
    });

    expect(warn.mock.calls).toEqual([]);
  });
});

describe('defineResourceSpec', () => {
  test('reads the provider, scope and kind from the slice table', () => {
    const { provider, scope, kind } = spec('twitchSubscriberEmotes');

    expect({ provider, scope, kind }).toEqual({
      provider: 'twitch',
      scope: 'channel',
      kind: 'emote',
    });
  });
});

describe('hadCachedResourcesForFailedSpecs', () => {
  test('returns true when a rejected spec still has cached items', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    const existingCache: ChannelCacheType = {
      ...makeEmptyEmoteData(),
      twitchChannelEmotes: [emote('cached')],
    };

    expect(
      hadCachedResourcesForFailedSpecs(
        { existingCache, existingGlobalCache: undefined },
        settled,
      ),
    ).toBe(true);
  });

  test('returns true when a rejected global spec still has items in the global slot', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('bttvGlobalEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    const existingGlobalCache: GlobalCacheType = {
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [emote('cached-global')],
    };

    expect(
      hadCachedResourcesForFailedSpecs(
        { existingCache: undefined, existingGlobalCache },
        settled,
      ),
    ).toBe(true);
  });

  test('returns false when a rejected spec has no cached fallback', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'rejected', reason: new Error('boom') },
      },
    ];

    expect(
      hadCachedResourcesForFailedSpecs(
        { existingCache: undefined, existingGlobalCache: undefined },
        settled,
      ),
    ).toBe(false);
  });
});

describe('describeProviderFailureReason', () => {
  test('reports the HTTP status when the service answered with an error', () => {
    expect(describeProviderFailureReason(new ApiError('nope', 503))).toBe(
      'HTTP 503',
    );
  });

  test('reports a timeout when the fetch stalled past the deadline', () => {
    expect(
      describeProviderFailureReason(
        new ResourceFetchTimeoutError('bttv', 1000),
      ),
    ).toBe('timed out');
  });

  test('falls back to the error message for other failures', () => {
    expect(describeProviderFailureReason(new Error('offline'))).toBe('offline');
  });

  test('reports an unknown error for non-error rejections', () => {
    expect(describeProviderFailureReason('weird')).toBe('unknown error');
  });
});

describe('collectFailedProviderReasons', () => {
  test('annotates each failed provider with its reason in stable order', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('bttvGlobalEmotes'),
        result: { status: 'rejected', reason: new ApiError('nope', 500) },
      },
      {
        spec: spec('sevenTvChannelEmotes'),
        result: {
          status: 'rejected',
          reason: new ResourceFetchTimeoutError('7tv', 1000),
        },
      },
      {
        spec: spec('twitchChannelEmotes'),
        result: { status: 'fulfilled', value: [emote('ok')] },
      },
    ];

    expect(collectFailedProviderReasons(settled)).toEqual([
      '7TV (timed out)',
      'BTTV (HTTP 500)',
    ]);
  });

  test('uses the first rejected spec per provider for the reason', () => {
    const settled: SettledSpec<EmoteCacheKey, SanitisedEmote>[] = [
      {
        spec: spec('bttvChannelEmotes'),
        result: { status: 'rejected', reason: new ApiError('first', 500) },
      },
      {
        spec: spec('bttvGlobalEmotes'),
        result: { status: 'rejected', reason: new ApiError('second', 404) },
      },
    ];

    expect(collectFailedProviderReasons(settled)).toEqual(['BTTV (HTTP 500)']);
  });
});
