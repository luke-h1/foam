import { Image } from 'expo-image';

import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';

import {
  preloadChannelEmotes,
  preloadEmotes,
  preloadGlobalEmotes,
} from '../preloadEmotes';

const prefetchMock = jest.mocked(Image.prefetch);

const warnMock = jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});
const errorMock = jest.spyOn(logger.chat, 'error').mockImplementation(() => {});

const ANIMATED = { disableAnimations: false };

const warmedUrls = () =>
  prefetchMock.mock.calls.flatMap(([urls, cachePolicy]) => {
    expect(cachePolicy).toBe('disk');
    return urls;
  });

function emote(name: string, url = `https://example.com/${name}.webp`) {
  return {
    id: name,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://example.com/${name}`,
    url,
    static_url: `${url}.png`,
    site: 'BTTV',
    provider: 'bttv',
  } satisfies SanitisedEmote;
}

describe('preloadEmotes', () => {
  beforeEach(() => {
    prefetchMock.mockClear();
    prefetchMock.mockResolvedValue(true);
    warnMock.mockClear();
    errorMock.mockClear();
  });

  test('preloads each emote display URL once across calls', async () => {
    const first = emote('first', 'https://example.com/shared.webp');
    const duplicate = emote('duplicate', 'https://example.com/shared.webp');

    await preloadEmotes([first, duplicate], ANIMATED);
    await preloadEmotes([first], ANIMATED);

    expect(warmedUrls()).toEqual(['https://example.com/shared.webp']);
  });

  test('stops at the shared warm limit of 64 emotes', async () => {
    await preloadEmotes(
      Array.from({ length: 70 }, (_unused, index) => emote(`limit-${index}`)),
      ANIMATED,
    );

    expect(warmedUrls()).toHaveLength(64);
  });

  test('warms the still url a row renders when animations are disabled', async () => {
    await preloadEmotes([emote('still')], { disableAnimations: true });

    expect(warmedUrls()).toEqual(['https://example.com/still.webp.png']);
  });

  test('puts 7TV first for both global and channel preloads', async () => {
    await preloadGlobalEmotes(
      {
        twitchGlobalEmotes: [emote('twitch-global')],
        sevenTvGlobalEmotes: [emote('seven-tv-global')],
        bttvGlobalEmotes: [emote('bttv-global')],
        ffzGlobalEmotes: [emote('ffz-global')],
      },
      ANIMATED,
    );

    const globalFirst = warmedUrls()[0];

    prefetchMock.mockClear();

    await preloadChannelEmotes(
      {
        twitchChannelEmotes: [emote('twitch-channel')],
        sevenTvChannelEmotes: [emote('seven-tv-channel')],
        bttvChannelEmotes: [emote('bttv-channel')],
        ffzChannelEmotes: [emote('ffz-channel')],
      },
      ANIMATED,
    );

    expect([globalFirst, warmedUrls()[0]]).toEqual([
      'https://example.com/seven-tv-global.webp',
      'https://example.com/seven-tv-channel.webp',
    ]);
  });

  test('reports a rejected preload to Sentry and leaves the urls retryable', async () => {
    const failure = new Error('network down');
    prefetchMock.mockRejectedValue(failure);

    await preloadEmotes([emote('boom')], ANIMATED);

    expect(errorMock).toHaveBeenCalledTimes(1);

    expect(errorMock).toHaveBeenCalledWith('chat.emote.preload_failed', {
      name: 'chat_resources_error',
      error: failure,
      batchSize: 1,
      tags: {
        emoteProvider: 'unknown',
        emoteScale: null,
        emoteKind: null,
      },
    });

    prefetchMock.mockResolvedValue(true);
    await preloadEmotes([emote('boom')], ANIMATED);

    expect(warmedUrls()).toEqual([
      'https://example.com/boom.webp',
      'https://example.com/boom.webp',
    ]);
  });

  test('warns when a batch resolves as skipped', async () => {
    prefetchMock.mockResolvedValue(false);

    await preloadEmotes([emote('skipped')], ANIMATED);

    expect(warnMock).toHaveBeenCalledTimes(1);

    expect(errorMock).not.toHaveBeenCalled();
  });
});
