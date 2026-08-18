import type { SanitisedEmote } from '@app/types/emote';
import * as prefetchToDiskModule from '@app/utils/image/prefetchToDisk';
import { logger } from '@app/utils/logger';

import {
  preloadChannelEmotes,
  preloadEmotes,
  preloadGlobalEmotes,
} from '../preloadEmotes';

const prefetchMock = jest
  .spyOn(prefetchToDiskModule, 'prefetchToDisk')
  .mockResolvedValue(true);
const warnMock = jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});
const errorMock = jest.spyOn(logger.chat, 'error').mockImplementation(() => {});

// prefetch warms a batch of urls per call; flatten to the warmed url sequence.
const warmedUrls = () => prefetchMock.mock.calls.flatMap(([urls]) => urls);

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

    await preloadEmotes([first, duplicate]);
    await preloadEmotes([first]);

    expect(warmedUrls()).toEqual(['https://example.com/shared.webp']);
  });

  test('respects the requested preload limit', async () => {
    await preloadEmotes([emote('one'), emote('two')], 1);

    expect(warmedUrls()).toEqual(['https://example.com/one.webp']);
  });

  test('keeps global and channel preload ordering stable', async () => {
    await preloadGlobalEmotes({
      twitchGlobalEmotes: [emote('twitch-global')],
      sevenTvGlobalEmotes: [emote('seven-tv-global')],
      bttvGlobalEmotes: [emote('bttv-global')],
      ffzGlobalEmotes: [emote('ffz-global')],
    });
    prefetchMock.mockClear();

    await preloadChannelEmotes({
      twitchChannelEmotes: [emote('twitch-channel')],
      sevenTvChannelEmotes: [emote('seven-tv-channel')],
      bttvChannelEmotes: [emote('bttv-channel')],
      ffzChannelEmotes: [emote('ffz-channel')],
    });

    expect(warmedUrls()[0]).toBe('https://example.com/seven-tv-channel.webp');
  });

  test('reports a rejected preload to Sentry and leaves the urls retryable', async () => {
    const failure = new Error('network down');
    prefetchMock.mockRejectedValue(failure);

    await preloadEmotes([emote('boom')]);

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
    await preloadEmotes([emote('boom')]);

    expect(warmedUrls()).toEqual([
      'https://example.com/boom.webp',
      'https://example.com/boom.webp',
    ]);
  });

  test('warns when a batch resolves as skipped', async () => {
    prefetchMock.mockResolvedValue(false);

    await preloadEmotes([emote('skipped')]);

    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(errorMock).not.toHaveBeenCalled();
  });
});
