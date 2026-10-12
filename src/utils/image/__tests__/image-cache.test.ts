import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
  getCacheDirectoryPath,
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
    listFileNames: (directoryUri: string) => string[];
    pendingDownloadCount: () => number;
    releaseDownload: () => void;
    releaseAllDownloads: () => void;
    setDeferDownloads: (defer: boolean) => void;
    setFileSize: (size: number) => void;
    reset: () => void;
  };
};

/**
 * jest-expo's preset mocks this entry point with no-op stubs, which beats the
 * root mock. Use the root mock so deletes and listings hit the fake disk.
 */
jest.mock('expo-file-system/legacy', () =>
  jest.requireActual('../../../../__mocks__/expo-file-system/legacy'),
);

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

  test('trims to 90% of MAX_CACHE_RECORDS once the cap is passed', async () => {
    const urls = Array.from(
      { length: 5001 },
      (_, i) => `https://example.com/record-${i}.png`,
    );

    await Promise.all(urls.slice(0, 5000).map(url => cacheImageFromUrl(url)));
    expect(listCachedImages()).toHaveLength(5000);

    await cacheImageFromUrl(urls.at(-1)!);

    expect(listCachedImages()).toHaveLength(4500);
    expect(getCachedImageUri(urls.at(-1)!)).not.toBeNull();
    expect(getCachedImageUri(urls[0])).toBeNull();
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

  test('a download that finishes after a clear records nothing, deletes its file and returns the source url', async () => {
    fileSystemMock.setDeferDownloads(true);
    const url = 'https://example.com/cleared-mid-download.png';

    const download = cacheImageFromUrl(url);
    await flushMicrotasks();

    clearSessionCache();
    fileSystemMock.releaseAllDownloads();
    const result = await download;
    await flushMicrotasks();

    expect([
      result,
      listCachedImages(),
      fileSystemMock.listFileNames(getCacheDirectoryPath()),
    ]).toEqual([url, [], []]);
  });

  test('a download from before a clear keeps its file when a newer download uses the same path', async () => {
    fileSystemMock.setDeferDownloads(true);
    const url = 'https://example.com/shared-path.png';

    const staleDownload = cacheImageFromUrl(url);
    await flushMicrotasks();

    clearSessionCache();
    const freshDownload = cacheImageFromUrl(url);
    await flushMicrotasks();

    fileSystemMock.releaseDownload();
    await staleDownload;
    await flushMicrotasks();

    const fileCount = fileSystemMock.listFileNames(
      getCacheDirectoryPath(),
    ).length;

    fileSystemMock.releaseAllDownloads();
    await freshDownload;

    expect(fileCount).toBe(1);
  });

  test('a clear resolves queued downloads with their source url', async () => {
    fileSystemMock.setDeferDownloads(true);

    const urls = Array.from(
      { length: 6 },
      (_, i) => `https://example.com/queued-${i}.png`,
    );

    const downloads = urls.map(url => cacheImageFromUrl(url));
    await flushMicrotasks();

    clearSessionCache();
    const queuedResults = await Promise.all(downloads.slice(4));

    fileSystemMock.releaseAllDownloads();
    await Promise.all(downloads);

    expect(queuedResults).toEqual(urls.slice(4));
  });

  test('a download from before a clear does not drop the dedupe entry of a newer one', async () => {
    fileSystemMock.setDeferDownloads(true);
    const url = 'https://example.com/redownloaded.png';

    const staleDownload = cacheImageFromUrl(url);
    await flushMicrotasks();

    clearSessionCache();
    const freshDownload = cacheImageFromUrl(url);
    await flushMicrotasks();

    fileSystemMock.releaseDownload();
    await staleDownload;

    const repeatDownload = cacheImageFromUrl(url);
    await flushMicrotasks();

    fileSystemMock.releaseAllDownloads();
    await Promise.all([freshDownload, repeatDownload]);

    expect(fileSystemMock.downloadCount()).toBe(2);
  });
});

describe('image-cache access time', () => {
  test('saves the access time at most once an hour, so eviction order survives a restart', async () => {
    jest.resetModules();

    const imageCache: typeof import('@app/utils/image/image-cache') = require('@app/utils/image/image-cache');
    const storage = require('react-native-mmkv').createMMKV({
      id: 'image-cache-manifest',
    });

    const url = 'https://example.com/used-daily.png';
    const startedAt = Date.now();
    let now = startedAt;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      await imageCache.cacheImageFromUrl(url);
      const key = imageCache.listCachedImages()[0]?.key;

      const storedAccess = () => {
        const record: { lastAccessed: number } = JSON.parse(
          storage.getString(`image-cache-record:${key}`),
        );

        return record.lastAccessed;
      };

      now = startedAt + 30 * 60 * 1000;
      imageCache.getCachedImageUri(url);
      const afterHalfHour = storedAccess();

      now = startedAt + 61 * 60 * 1000;
      imageCache.getCachedImageUri(url);

      expect([afterHalfHour, storedAccess()]).toEqual([
        startedAt,
        startedAt + 61 * 60 * 1000,
      ]);
    } finally {
      nowSpy.mockRestore();
    }
  });
});

describe('image-cache manifest validation', () => {
  const cacheDirUri = 'file:///cache/chat-img-cache/';

  interface FreshCache {
    imageCache: typeof import('@app/utils/image/image-cache');
    readDirectoryAsync: jest.Mock;
  }

  /**
   * Loads a fresh module graph with two persisted records, so hydration and
   * the one-time validation run again. Only `kept.png` exists on disk.
   */
  const loadWithPersistedRecords = (): FreshCache => {
    jest.resetModules();

    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'image-cache-manifest' });

    ['kept', 'gone'].forEach(key => {
      storage.set(
        `image-cache-record:${key}`,
        JSON.stringify({
          key,
          lastAccessed: 1,
          name: `${key}.png`,
          size: 10,
          sourceUrl: `https://example.com/${key}.png`,
          uri: `${cacheDirUri}${key}.png`,
        }),
      );
    });

    require('expo-file-system').__mockFileSystem.addFile(
      `${cacheDirUri}kept.png`,
      10,
    );

    return {
      imageCache: require('@app/utils/image/image-cache'),
      readDirectoryAsync: require('expo-file-system/legacy').readDirectoryAsync,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('drops records whose file is missing from one directory listing', async () => {
    const { imageCache, readDirectoryAsync } = loadWithPersistedRecords();

    expect(imageCache.listCachedImages().map(record => record.key)).toEqual([
      'kept',
      'gone',
    ]);

    await jest.advanceTimersByTimeAsync(1000);

    expect(readDirectoryAsync.mock.calls).toEqual([[cacheDirUri]]);
    expect(imageCache.listCachedImages().map(record => record.key)).toEqual([
      'kept',
    ]);
  });

  test('keeps a record written while the listing is in flight', async () => {
    const { imageCache, readDirectoryAsync } = loadWithPersistedRecords();

    let finishListing: (names: string[]) => void = () => {};

    readDirectoryAsync.mockImplementationOnce(
      () =>
        new Promise<string[]>(resolve => {
          finishListing = resolve;
        }),
    );

    imageCache.listCachedImages();
    await jest.advanceTimersByTimeAsync(1000);

    const lateUri = await imageCache.cacheImageFromUrl(
      'https://example.com/late.png',
    );

    finishListing(['kept.png']);
    await jest.advanceTimersByTimeAsync(0);

    expect(imageCache.listCachedImages().map(record => record.uri)).toEqual([
      `${cacheDirUri}kept.png`,
      lateUri,
    ]);
  });
});
