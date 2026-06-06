import type { SanitisedEmote } from '@app/types/emote';
import { cacheEmoteImages, clearEmoteImageCache } from '../emoteImages';
import {
  clearSessionCache,
  getCachedImageUri,
  warmImageCache,
} from '@app/utils/image/image-cache';

jest.mock('@app/utils/image/image-cache', () => ({
  cacheImageFromUrl: jest.fn(),
  clearSessionCache: jest.fn(),
  getCachedImageUri: jest.fn(),
  warmImageCache: jest.fn(),
}));

const clearSessionCacheMock = jest.mocked(clearSessionCache);
const getCachedImageUriMock = jest.mocked(getCachedImageUri);
const warmImageCacheMock = jest.mocked(warmImageCache);

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

describe('emote image cache helpers', () => {
  beforeEach(() => {
    clearEmoteImageCache();
    jest.clearAllMocks();
  });

  test('warms uncached emote URLs once', async () => {
    getCachedImageUriMock.mockImplementation(url =>
      url === 'https://example.com/cached.webp' ? 'file:///cached.webp' : null,
    );

    await cacheEmoteImages([
      emote('one'),
      emote('duplicate', 'https://example.com/one.webp'),
      emote('cached', 'https://example.com/cached.webp'),
      emote('inline', 'data:image/png;base64,abc'),
    ]);

    expect(warmImageCacheMock).toHaveBeenCalledWith(
      [
        'https://example.com/one.webp',
        'https://example.com/one.webp.png',
        'https://example.com/cached.webp.png',
      ],
      { priority: 'interactive', signal: undefined, variant: 'emote' },
    );
  });

  test('does not warm image cache when the request is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await cacheEmoteImages([emote('one')], controller.signal);

    expect(warmImageCacheMock).not.toHaveBeenCalled();
  });

  test('clears session cache', () => {
    clearEmoteImageCache();

    expect(clearSessionCacheMock).toHaveBeenCalled();
  });
});
