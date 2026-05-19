import type { SanitisedEmote } from '@app/types/emote';
import {
  cacheEmoteImage,
  cacheEmoteImages,
  clearEmoteImageCache,
  getCachedEmoteUri,
} from '../emoteImages';
import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
  warmImageCache,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';

jest.mock('@app/utils/image/image-cache', () => ({
  cacheImageFromUrl: jest.fn(),
  clearSessionCache: jest.fn(),
  getCachedImageUri: jest.fn(),
  warmImageCache: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      warn: jest.fn(),
    },
  },
}));

const cacheImageFromUrlMock = jest.mocked(cacheImageFromUrl);
const clearSessionCacheMock = jest.mocked(clearSessionCache);
const getCachedImageUriMock = jest.mocked(getCachedImageUri);
const warmImageCacheMock = jest.mocked(warmImageCache);
const loggerWarnMock = jest.mocked(logger.chat.warn);

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

  test('returns passthrough URLs without cache work for local or inline emotes', async () => {
    await expect(cacheEmoteImage('data:image/png;base64,abc')).resolves.toBe(
      'data:image/png;base64,abc',
    );
    expect(getCachedEmoteUri('file:///cache/emote.png')).toBe(
      'file:///cache/emote.png',
    );

    expect(cacheImageFromUrlMock).not.toHaveBeenCalled();
    expect(getCachedImageUriMock).not.toHaveBeenCalled();
  });

  test('reuses existing cached emote images', async () => {
    getCachedImageUriMock.mockReturnValueOnce('file:///cache/emote.webp');

    await expect(
      cacheEmoteImage('https://example.com/emote.webp'),
    ).resolves.toBe('file:///cache/emote.webp');

    expect(cacheImageFromUrlMock).not.toHaveBeenCalled();
  });

  test('dedupes concurrent cache requests for the same emote URL', async () => {
    cacheImageFromUrlMock.mockResolvedValue('file:///cache/emote.webp');

    const first = cacheEmoteImage('https://example.com/emote.webp');
    const second = cacheEmoteImage('https://example.com/emote.webp');

    await expect(Promise.all([first, second])).resolves.toEqual([
      'file:///cache/emote.webp',
      'file:///cache/emote.webp',
    ]);
    expect(cacheImageFromUrlMock).toHaveBeenCalledTimes(1);
  });

  test('falls back to the original URL when caching fails', async () => {
    const error = new Error('download failed');
    cacheImageFromUrlMock.mockRejectedValue(error);

    await expect(
      cacheEmoteImage('https://example.com/emote.webp'),
    ).resolves.toBe('https://example.com/emote.webp');

    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Failed to cache emote image https://example.com/emote.webp...:',
      error,
    );
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

  test('clears session cache with in-flight emote cache state', () => {
    clearEmoteImageCache();

    expect(clearSessionCacheMock).toHaveBeenCalled();
  });
});
