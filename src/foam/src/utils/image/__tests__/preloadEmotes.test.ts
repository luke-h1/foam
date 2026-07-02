import { Image as ExpoImage } from 'expo-image';

import type { SanitisedEmote } from '@app/types/emote';

import {
  clearPreloadCache,
  preloadChannelEmotes,
  preloadEmotes,
  preloadGlobalEmotes,
} from '../preloadEmotes';

jest.mock('expo-image', () => ({
  Image: {
    prefetch: jest.fn().mockResolvedValue(true),
  },
}));

const prefetchMock = jest.mocked(ExpoImage.prefetch);

// prefetch warms a batch of urls per call; flatten to the warmed url sequence.
const warmedUrls = () =>
  prefetchMock.mock.calls.flatMap(([urls]) =>
    Array.isArray(urls) ? urls : [urls],
  );

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
  } satisfies SanitisedEmote;
}

describe('preloadEmotes', () => {
  beforeEach(() => {
    clearPreloadCache();
    prefetchMock.mockClear();
  });

  test('preloads each emote cache URL once across calls', async () => {
    const first = emote('first', 'https://example.com/shared.webp');
    const duplicate = emote('duplicate', 'https://example.com/shared.webp');

    await preloadEmotes([first, duplicate]);
    await preloadEmotes([first]);

    expect(warmedUrls()).toEqual([
      'https://example.com/shared.webp',
      'https://example.com/shared.webp.png',
    ]);
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
    clearPreloadCache();
    prefetchMock.mockClear();

    await preloadChannelEmotes({
      twitchChannelEmotes: [emote('twitch-channel')],
      sevenTvChannelEmotes: [emote('seven-tv-channel')],
      bttvChannelEmotes: [emote('bttv-channel')],
      ffzChannelEmotes: [emote('ffz-channel')],
    });

    expect(warmedUrls()[0]).toBe('https://example.com/seven-tv-channel.webp');
  });
});
