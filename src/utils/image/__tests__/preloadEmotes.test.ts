import type { SanitisedEmote } from '@app/types/emote';
import {
  clearPreloadCache,
  preloadChannelEmotes,
  preloadEmotes,
  preloadGlobalEmotes,
} from '../preloadEmotes';

jest.mock('react-native-nitro-web-image', () => ({
  WebImages: {
    preload: jest.fn(),
  },
}));

const webImagesMock = jest.requireMock('react-native-nitro-web-image')
  .WebImages as {
  preload: jest.Mock;
};

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
    webImagesMock.preload.mockReset();
  });

  test('preloads each emote cache URL once across calls', async () => {
    const first = emote('first', 'https://example.com/shared.webp');
    const duplicate = emote('duplicate', 'https://example.com/shared.webp');

    await preloadEmotes([first, duplicate]);
    await preloadEmotes([first]);

    expect(webImagesMock.preload.mock.calls.map(([url]) => url)).toEqual([
      'https://example.com/shared.webp',
      'https://example.com/shared.webp.png',
    ]);
  });

  test('respects the requested preload limit', async () => {
    await preloadEmotes([emote('one'), emote('two')], 1);

    expect(webImagesMock.preload).toHaveBeenCalledTimes(1);
    expect(webImagesMock.preload).toHaveBeenCalledWith(
      'https://example.com/one.webp',
    );
  });

  test('keeps global and channel preload ordering stable', async () => {
    await preloadGlobalEmotes({
      twitchGlobalEmotes: [emote('twitch-global')],
      sevenTvGlobalEmotes: [emote('seven-tv-global')],
      bttvGlobalEmotes: [emote('bttv-global')],
      ffzGlobalEmotes: [emote('ffz-global')],
    });
    clearPreloadCache();
    webImagesMock.preload.mockClear();

    await preloadChannelEmotes({
      twitchChannelEmotes: [emote('twitch-channel')],
      sevenTvChannelEmotes: [emote('seven-tv-channel')],
      bttvChannelEmotes: [emote('bttv-channel')],
      ffzChannelEmotes: [emote('ffz-channel')],
    });

    expect(webImagesMock.preload.mock.calls[0]?.[0]).toBe(
      'https://example.com/seven-tv-channel.webp',
    );
  });
});
