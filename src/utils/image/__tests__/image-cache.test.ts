jest.mock('expo-file-system', () => {
  const existingUris = new Set<string>();
  let downloadCount = 0;

  class Directory {
    uri: string;

    constructor(base: string | { uri: string }, name?: string) {
      const baseUri = typeof base === 'string' ? base : base.uri;
      this.uri = name ? `${baseUri.replace(/\/?$/, '/')}${name}/` : baseUri;
    }

    get exists() {
      return true;
    }

    delete() {
      Array.from(existingUris).forEach(uri => {
        if (uri.startsWith(this.uri)) {
          existingUris.delete(uri);
        }
      });
    }
  }

  class File {
    uri: string;
    size = 128;

    constructor(base: string | { uri: string }, name?: string) {
      this.uri =
        typeof base === 'string'
          ? base
          : `${base.uri.replace(/\/?$/, '/')}${name ?? ''}`;
    }

    static async downloadFileAsync(_url: string, cacheDir: Directory) {
      downloadCount += 1;
      const file = new File(cacheDir, `download-${downloadCount}.png`);
      existingUris.add(file.uri);
      return file;
    }

    get exists() {
      return existingUris.has(this.uri);
    }

    delete() {
      existingUris.delete(this.uri);
    }

    move(destination: File) {
      existingUris.delete(this.uri);
      this.uri = destination.uri;
      existingUris.add(destination.uri);
    }

    write() {
      existingUris.add(this.uri);
    }

    async base64() {
      return 'base64';
    }
  }

  return {
    Directory,
    File,
    Paths: {
      cache: 'file:///cache/',
    },
    __mockFileSystem: {
      downloadCount: () => downloadCount,
      evict: (uri: string) => existingUris.delete(uri),
      exists: (uri: string) => existingUris.has(uri),
      reset: () => {
        downloadCount = 0;
        existingUris.clear();
      },
    },
  };
});

jest.mock('expo-file-system/legacy', () => ({
  makeDirectoryAsync: jest.fn(),
}));

import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';

const fileSystemMock = jest.requireMock('expo-file-system')
  .__mockFileSystem as {
  downloadCount: () => number;
  evict: (uri: string) => void;
  exists: (uri: string) => boolean;
  reset: () => void;
};
const mmkvMock = jest.requireMock('react-native-mmkv') as {
  __resetMMKV: () => void;
};

describe('image-cache', () => {
  beforeEach(() => {
    mmkvMock.__resetMMKV();
    fileSystemMock.reset();
  });

  test('does not return manifest URIs after the cached file is evicted', async () => {
    const url = 'https://example.com/source-badge.png';
    const options = { variant: 'badge' };

    const cachedUri = await cacheImageFromUrl(url, options);
    expect(getCachedImageUri(url, options)).toBe(cachedUri);

    fileSystemMock.evict(cachedUri);

    expect(getCachedImageUri(url, options)).toBeNull();

    await cacheImageFromUrl(url, options);

    expect(fileSystemMock.downloadCount()).toBe(2);
    expect(fileSystemMock.exists(cachedUri)).toBe(true);
  });

  test('re-downloads when a manifest record points at an evicted file', async () => {
    const url = 'https://example.com/source-channel-badge.png';
    const options = { variant: 'badge' };

    const cachedUri = await cacheImageFromUrl(url, options);
    fileSystemMock.evict(cachedUri);

    const refreshedUri = await cacheImageFromUrl(url, options);

    expect(refreshedUri).toBe(cachedUri);
    expect(fileSystemMock.downloadCount()).toBe(2);
    expect(fileSystemMock.exists(cachedUri)).toBe(true);
  });
});
