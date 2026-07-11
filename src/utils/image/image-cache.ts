import { createMMKV } from 'react-native-mmkv';

import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';

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
let taskQueueDirty = false;

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

// Running total of manifest bytes, maintained at every mutation so eviction
// checks don't reduce over the full (up to 5000-record) manifest per
// completed download.
let manifestTotalBytes = 0;

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
      const previous = manifest.get(record.key);
      manifestTotalBytes += record.size - (previous?.size ?? 0);
      manifest.set(record.key, record);
    } catch {
      manifestStorage.remove(storageKey);
    }
  });

  validateManifestSoon();
}

function persistRecord(record: CacheRecord): void {
  const previous = manifest.get(record.key);
  manifestTotalBytes += record.size - (previous?.size ?? 0);
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
  manifestTotalBytes -= record.size;
  verifiedFiles.delete(record.uri);
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

function getCachedFile(cacheDir: Directory, key: string, url: string): File {
  return new File(cacheDir, `${key}.${getFileExtensionFromUrl(url)}`);
}

function touchRecord(record: CacheRecord): string {
  record.lastAccessed = Date.now();
  manifest.set(record.key, record);
  return record.uri;
}

// getCachedImageUri runs during render for every chat emote and badge, and
// File.exists is a synchronous syscall on the JS thread. Trust a successful
// stat for a while instead of re-statting per render; eviction still
// self-heals once the verification expires, and removeRecord /
// clearSessionCache invalidate immediately.
const FILE_VERIFICATION_TTL_MS = 10 * 60 * 1000;
const verifiedFiles = new Map<string, number>();

function cachedFileExists(record: CacheRecord): boolean {
  const verifiedAt = verifiedFiles.get(record.uri);
  if (
    verifiedAt !== undefined &&
    Date.now() - verifiedAt < FILE_VERIFICATION_TTL_MS
  ) {
    return true;
  }

  try {
    const exists = new File(record.uri).exists;
    if (exists) {
      verifiedFiles.set(record.uri, Date.now());
    } else {
      verifiedFiles.delete(record.uri);
    }
    return exists;
  } catch {
    verifiedFiles.delete(record.uri);
    return false;
  }
}

function getValidRecord(key: string): CacheRecord | undefined {
  const record = manifest.get(key);
  if (!record) {
    return undefined;
  }

  if (!cachedFileExists(record)) {
    removeRecord(key);
    return undefined;
  }

  return record;
}

function sortTasks(): void {
  taskQueue.sort((a, b) => {
    const priorityDelta =
      priorityRank(a.options.priority) - priorityRank(b.options.priority);
    return priorityDelta === 0 ? a.sequence - b.sequence : priorityDelta;
  });
}

function drainQueue(): void {
  // Sort once per drain, and only when something was enqueued since the last
  // sort - shift() preserves order across dequeues.
  if (taskQueueDirty) {
    taskQueueDirty = false;
    sortTasks();
  }
  while (activeDownloads < DOWNLOAD_CONCURRENCY && taskQueue.length > 0) {
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
    taskQueueDirty = true;
    drainQueue();
  });
  inFlight.set(key, promise);
  return promise;
}

function evictIfNeeded(protectedKey: string): void {
  if (
    manifestTotalBytes <= MAX_CACHE_BYTES &&
    manifest.size <= MAX_CACHE_RECORDS
  ) {
    return;
  }

  Array.from(manifest.values())
    .filter(record => record.key !== protectedKey)
    .sort((a, b) => a.lastAccessed - b.lastAccessed)
    .forEach(record => {
      if (
        manifestTotalBytes <= MAX_CACHE_BYTES &&
        manifest.size <= MAX_CACHE_RECORDS
      ) {
        return;
      }
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

export async function cacheImageFromUrl(
  url: string,
  options: CacheImageOptions = {},
): Promise<string> {
  hydrateManifest();

  if (!isCacheableUri(url) || options.signal?.aborted) {
    return url;
  }

  const key = getCacheKey(url, options.variant);
  const existing = getValidRecord(key);
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
          await downloadedFile.move(cachedFile);
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
  const record = getValidRecord(getCacheKey(url, options.variant));
  return record ? touchRecord(record) : null;
}

export function clearSessionCache(): void {
  hydrateManifest();
  taskQueue.length = 0;
  inFlight.clear();
  verifiedFiles.clear();

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
  for (const url of urls) {
    if (!isCacheableUri(url)) {
      continue;
    }
    if (getCachedImageUri(url, { variant: options.variant })) {
      continue;
    }
    void cacheImageFromUrl(url, options);
  }
}
