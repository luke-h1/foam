import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { createMMKV } from 'react-native-mmkv';

export const BLURHASH = 'LBDbA}oL00Na~B9u57={XRay-Uj[';

const CACHE_DIR_NAME = 'chat-img-cache';
const RECORD_PREFIX = 'image-cache-record:';
const MAX_CACHE_BYTES = 100 * 1024 * 1024;
const MAX_CACHE_RECORDS = 5000;
const DOWNLOAD_CONCURRENCY = 4;

export type ImageCachePriority = 'visible' | 'interactive' | 'background';

export type CacheImageOptions = {
  priority?: ImageCachePriority;
  signal?: AbortSignal;
  variant?: string;
};

export interface CachedImageInfo {
  uri: string;
  name: string;
  size: number;
  key?: string;
  lastAccessed?: number;
  sourceUrl?: string;
  variant?: string;
}

type CacheRecord = Required<
  Pick<CachedImageInfo, 'key' | 'lastAccessed' | 'name' | 'size' | 'uri'>
> & {
  sourceUrl: string;
  variant?: string;
};

type DownloadTask = {
  key: string;
  options: CacheImageOptions;
  reject: (reason?: unknown) => void;
  resolve: (uri: string) => void;
  run: () => Promise<string>;
  sequence: number;
  url: string;
};

const manifestStorage = createMMKV({
  id: 'image-cache-manifest',
  compareBeforeSet: true,
});

const manifest = new Map<string, CacheRecord>();
const inFlight = new Map<string, Promise<string>>();
const taskQueue: DownloadTask[] = [];

let activeDownloads = 0;
let sequence = 0;
let hydrated = false;
let validationStarted = false;

function priorityRank(priority: ImageCachePriority | undefined): number {
  if (priority === 'visible') {
    return 0;
  }
  if (priority === 'interactive') {
    return 1;
  }
  return 2;
}

function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash ^= str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // eslint-disable-next-line no-bitwise
  return (hash >>> 0).toString(16);
}

function getFileExtensionFromUrl(url: string): string {
  try {
    const match = new URL(url).pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)/i);
    if (!match?.[1]) {
      return 'img';
    }
    return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  } catch {
    return 'img';
  }
}

function isCacheableUri(uri: string | undefined): uri is string {
  return typeof uri === 'string' && /^https?:\/\//i.test(uri);
}

function getCacheKey(url: string, variant = 'original'): string {
  return `${hashString(`${variant}:${url}`)}-${variant.replace(/[^a-z0-9_-]/gi, '_')}`;
}

function getRecordStorageKey(key: string): string {
  return `${RECORD_PREFIX}${key}`;
}

function hydrateManifest(): void {
  if (hydrated) {
    return;
  }
  hydrated = true;

  manifestStorage.getAllKeys().forEach(storageKey => {
    if (!storageKey.startsWith(RECORD_PREFIX)) {
      return;
    }
    const raw = manifestStorage.getString(storageKey);
    if (!raw) {
      return;
    }

    try {
      const record = JSON.parse(raw) as CacheRecord;
      manifest.set(record.key, record);
    } catch {
      manifestStorage.remove(storageKey);
    }
  });

  validateManifestSoon();
}

function persistRecord(record: CacheRecord): void {
  manifest.set(record.key, record);
  manifestStorage.set(getRecordStorageKey(record.key), JSON.stringify(record));
}

function removeRecord(key: string): void {
  const record = manifest.get(key);
  manifest.delete(key);
  manifestStorage.remove(getRecordStorageKey(key));

  if (!record) {
    return;
  }
  try {
    const file = new File(record.uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore filesystem cleanup errors.
  }
}

async function ensureCacheDirectoryAsync(): Promise<Directory> {
  const cacheDir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!cacheDir.exists) {
    await FileSystemLegacy.makeDirectoryAsync(cacheDir.uri, {
      intermediates: true,
    });
  }
  return cacheDir;
}

function ensureCacheDirectory(): Directory {
  return new Directory(Paths.cache, CACHE_DIR_NAME);
}

function getCachedFile(cacheDir: Directory, key: string, url: string): File {
  return new File(cacheDir, `${key}.${getFileExtensionFromUrl(url)}`);
}

function touchRecord(record: CacheRecord): string {
  record.lastAccessed = Date.now();
  manifest.set(record.key, record);
  return record.uri;
}

function sortTasks(): void {
  taskQueue.sort((a, b) => {
    const priorityDelta =
      priorityRank(a.options.priority) - priorityRank(b.options.priority);
    return priorityDelta === 0 ? a.sequence - b.sequence : priorityDelta;
  });
}

function drainQueue(): void {
  while (activeDownloads < DOWNLOAD_CONCURRENCY && taskQueue.length > 0) {
    sortTasks();
    const task = taskQueue.shift();
    if (!task) {
      return;
    }

    if (task.options.signal?.aborted) {
      inFlight.delete(task.key);
      task.resolve(task.url);
      continue;
    }

    activeDownloads += 1;
    task
      .run()
      .then(task.resolve, task.reject)
      .finally(() => {
        activeDownloads -= 1;
        inFlight.delete(task.key);
        drainQueue();
      });
  }
}

function enqueueDownload(
  key: string,
  url: string,
  options: CacheImageOptions,
  run: () => Promise<string>,
): Promise<string> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  const promise = new Promise<string>((resolve, reject) => {
    taskQueue.push({
      key,
      options,
      reject,
      resolve,
      run,
      sequence: (sequence += 1),
      url,
    });
    drainQueue();
  });
  inFlight.set(key, promise);
  return promise;
}

function evictIfNeeded(protectedKey: string): void {
  const records = Array.from(manifest.values());
  let totalBytes = records.reduce((acc, record) => acc + record.size, 0);
  if (totalBytes <= MAX_CACHE_BYTES && records.length <= MAX_CACHE_RECORDS) {
    return;
  }

  records
    .filter(record => record.key !== protectedKey)
    .sort((a, b) => a.lastAccessed - b.lastAccessed)
    .forEach(record => {
      if (totalBytes <= MAX_CACHE_BYTES && manifest.size <= MAX_CACHE_RECORDS) {
        return;
      }
      totalBytes -= record.size;
      removeRecord(record.key);
    });
}

function validateManifestSoon(): void {
  if (validationStarted) {
    return;
  }
  validationStarted = true;

  setTimeout(() => {
    Array.from(manifest.values()).forEach(record => {
      try {
        if (!new File(record.uri).exists) {
          removeRecord(record.key);
        }
      } catch {
        removeRecord(record.key);
      }
    });
  }, 1000);
}

export function cacheBase64Image(
  base64: string,
  ext: 'png' | 'jpg' = 'png',
): string {
  const cacheDir = ensureCacheDirectory();
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const file = new File(cacheDir, `${key}.${ext}`);
  file.write(base64);
  return file.uri;
}

export async function cacheImageFromUrl(
  url: string,
  options: CacheImageOptions = {},
): Promise<string> {
  hydrateManifest();

  if (!isCacheableUri(url) || options.signal?.aborted) {
    return url;
  }

  const key = getCacheKey(url, options.variant);
  const existing = manifest.get(key);
  if (existing) {
    return touchRecord(existing);
  }

  return enqueueDownload(key, url, options, async () => {
    const cacheDir = await ensureCacheDirectoryAsync();
    const cachedFile = getCachedFile(cacheDir, key, url);

    if (cachedFile.exists) {
      const record: CacheRecord = {
        key,
        lastAccessed: Date.now(),
        name: cachedFile.uri.split('/').pop() ?? key,
        size: cachedFile.size ?? 0,
        sourceUrl: url,
        uri: cachedFile.uri,
        variant: options.variant,
      };
      persistRecord(record);
      evictIfNeeded(key);
      return cachedFile.uri;
    }

    try {
      const downloadedFile = await File.downloadFileAsync(url, cacheDir);

      if (downloadedFile.uri !== cachedFile.uri) {
        if (cachedFile.exists) {
          downloadedFile.delete();
        } else {
          downloadedFile.move(cachedFile);
        }
      }

      const record: CacheRecord = {
        key,
        lastAccessed: Date.now(),
        name: cachedFile.uri.split('/').pop() ?? key,
        size: cachedFile.size ?? downloadedFile.size ?? 0,
        sourceUrl: url,
        uri: cachedFile.uri,
        variant: options.variant,
      };
      persistRecord(record);
      evictIfNeeded(key);
      return cachedFile.uri;
    } catch {
      if (cachedFile.exists) {
        return cachedFile.uri;
      }
      return url;
    }
  });
}

export function getCachedImageUri(
  url?: string,
  options: Pick<CacheImageOptions, 'variant'> = {},
): string | null {
  hydrateManifest();
  if (!url) {
    return null;
  }
  return manifest.get(getCacheKey(url, options.variant))?.uri ?? null;
}

export async function getCachedImageAsBase64(fileUri: string): Promise<string> {
  const file = new File(fileUri);
  const base64 = await file.base64();
  return `data:image/png;base64,${base64}`;
}

export function deleteCachedImageByUrl(
  url?: string,
  options: Pick<CacheImageOptions, 'variant'> = {},
): void {
  hydrateManifest();
  if (!url) {
    return;
  }
  removeRecord(getCacheKey(url, options.variant));
}

export function deleteCachedImage(fileUri?: string): void {
  hydrateManifest();
  if (!fileUri) {
    return;
  }

  const record = Array.from(manifest.values()).find(
    item => item.uri === fileUri,
  );
  if (record) {
    removeRecord(record.key);
  }
}

export function clearSessionCache(): void {
  hydrateManifest();
  taskQueue.length = 0;
  inFlight.clear();

  Array.from(manifest.keys()).forEach(removeRecord);

  try {
    const cacheDir = new Directory(Paths.cache, CACHE_DIR_NAME);
    if (cacheDir.exists) {
      cacheDir.delete();
    }
  } catch {
    // Ignore filesystem cleanup errors.
  }
}

export function listCachedImages(): CachedImageInfo[] {
  hydrateManifest();
  return Array.from(manifest.values());
}

export function getCacheDirectoryPath(): string {
  return new Directory(Paths.cache, CACHE_DIR_NAME).uri;
}

export function warmImageCache(
  urls: string[],
  options: CacheImageOptions = {},
): void {
  hydrateManifest();
  urls
    .filter(isCacheableUri)
    .filter(url => !getCachedImageUri(url, { variant: options.variant }))
    .forEach(url => {
      void cacheImageFromUrl(url, options);
    });
}
