import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
  listCachedImages,
} from '@app/utils/image/image-cache';

/**
 * `require`, not a static import: `__mockFileSystem` only exists on the
 * `__mocks__/expo-file-system.ts` manual mock, not the real module's types.
 */
// SAFETY: __mocks__/expo-file-system.ts defines __mockFileSystem with exactly this shape.
const { __mockFileSystem: fileSystemMock } = require('expo-file-system') as {
  __mockFileSystem: {
    downloadCount: () => number;
    evict: (uri: string) => boolean;
    exists: (uri: string) => boolean;
    pendingDownloadCount: () => number;
    releaseDownload: () => void;
    releaseAllDownloads: () => void;
    setDeferDownloads: (defer: boolean) => void;
    setFileSize: (size: number) => void;
    reset: () => void;
  };
};

const { __resetMMKV } = require('react-native-mmkv');

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('image-cache', () => {
  beforeEach(() => {
    clearSessionCache();
    __resetMMKV();
    fileSystemMock.reset();
  });

  test('does not return manifest URIs after the cached file is evicted', async () => {
    const url = 'https://example.com/source-badge.png';
    const options = { variant: 'badge' };

    const cachedUri = await cacheImageFromUrl(url, options);
    expect(getCachedImageUri(url, options)).toBe(cachedUri);

    fileSystemMock.evict(cachedUri);

    // Successful stats are trusted for a while so the render path does not
    // re-stat per emote; eviction is detected once the verification expires.
    const realNow = Date.now();
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => realNow + 11 * 60 * 1000);

    try {
      expect(getCachedImageUri(url, options)).toBeNull();

      await cacheImageFromUrl(url, options);

      expect(fileSystemMock.downloadCount()).toBe(2);
      expect(fileSystemMock.exists(cachedUri)).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('re-downloads when a manifest record points at an evicted file', async () => {
    const url = 'https://example.com/source-channel-badge.png';
    const options = { variant: 'badge' };

    const cachedUri = await cacheImageFromUrl(url, options);
    fileSystemMock.evict(cachedUri);

    const realNow = Date.now();
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => realNow + 11 * 60 * 1000);
    let refreshedUri: string;
    try {
      refreshedUri = await cacheImageFromUrl(url, options);
    } finally {
      nowSpy.mockRestore();
    }

    expect(refreshedUri).toBe(cachedUri);
    expect(fileSystemMock.downloadCount()).toBe(2);
    expect(fileSystemMock.exists(cachedUri)).toBe(true);
  });

  test('keys the same url separately per variant', async () => {
    const url = 'https://example.com/shared-art.png';

    const emoteUri = await cacheImageFromUrl(url, { variant: 'emote' });
    const badgeUri = await cacheImageFromUrl(url, { variant: 'badge' });

    expect(emoteUri).not.toBe(badgeUri);
    expect(fileSystemMock.downloadCount()).toBe(2);
    expect(getCachedImageUri(url, { variant: 'emote' })).toBe(emoteUri);
    expect(getCachedImageUri(url, { variant: 'badge' })).toBe(badgeUri);
    expect(getCachedImageUri(url)).toBeNull();
  });

  test('evicts least-recently-accessed records to stay under the byte budget', async () => {
    // Two 60MB files overflow the 100MB budget, so caching the second must
    // evict the first while protecting the record being inserted.
    fileSystemMock.setFileSize(60 * 1024 * 1024);
    const firstUrl = 'https://example.com/big-first.png';
    const secondUrl = 'https://example.com/big-second.png';

    const firstUri = await cacheImageFromUrl(firstUrl);
    expect(getCachedImageUri(firstUrl)).toBe(firstUri);

    const secondUri = await cacheImageFromUrl(secondUrl);

    expect(getCachedImageUri(secondUrl)).toBe(secondUri);
    expect(getCachedImageUri(firstUrl)).toBeNull();
    expect(fileSystemMock.exists(firstUri)).toBe(false);
  });

  test('caps the manifest at MAX_CACHE_RECORDS', async () => {
    const urls = Array.from(
      { length: 5001 },
      (_, i) => `https://example.com/record-${i}.png`,
    );

    await Promise.all(urls.map(url => cacheImageFromUrl(url)));

    expect(listCachedImages()).toHaveLength(5000);
    expect(getCachedImageUri(urls.at(-1)!)).not.toBeNull();
  }, 30_000);

  test('downloads at most four files concurrently and drains as slots free', async () => {
    fileSystemMock.setDeferDownloads(true);
    const urls = Array.from(
      { length: 6 },
      (_, i) => `https://example.com/concurrent-${i}.png`,
    );

    const downloads = urls.map(url => cacheImageFromUrl(url));
    await flushMicrotasks();

    expect(fileSystemMock.pendingDownloadCount()).toBe(4);

    fileSystemMock.releaseDownload();
    await flushMicrotasks();

    expect(fileSystemMock.pendingDownloadCount()).toBe(4);

    fileSystemMock.releaseAllDownloads();
    await flushMicrotasks();
    fileSystemMock.releaseAllDownloads();
    await Promise.all(downloads);

    expect(fileSystemMock.downloadCount()).toBe(6);
  });
});
