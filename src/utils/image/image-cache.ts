import { createMMKV } from 'react-native-mmkv';

import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';

const CACHE_DIR_NAME = 'chat-img-cache';
const RECORD_PREFIX = 'image-cache-record:';
const MAX_CACHE_BYTES = 100 * 1024 * 1024;
const MAX_CACHE_RECORDS = 5000;

/**
 * Eviction sorts the whole manifest, so it trims to this fraction of each
 * limit. A full cache then sorts once per few hundred downloads, not on every
 * download.
 */
const EVICTION_TARGET_RATIO = 0.9;

const DOWNLOAD_CONCURRENCY = 4;

export type CacheImageOptions = {
  signal?: AbortSignal | undefined;
  variant?: string | undefined;
};

export interface CachedImageInfo {
  uri: string;
  name: string;
  size: number;
  key?: string | undefined;
  lastAccessed?: number | undefined;
  sourceUrl?: string | undefined;
  variant?: string | undefined;
}

type CacheRecord = {
  key: string;
  lastAccessed: number;
  name: string;
  size: number;
  uri: string;
  sourceUrl: string;
  variant?: string | undefined;
};

type DownloadTask = {
  generation: number;
  key: string;
  options: CacheImageOptions;
  reject: (cause?: unknown) => void;
  resolve: (uri: string) => void;
  run: () => Promise<string>;
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
let hydrated = false;
let validationStarted = false;

/**
 * `clearSessionCache` increments this. A download that started before the
 * clear must not record its file, because the clear deletes the directory.
 */
let cacheGeneration = 0;

/**
 * Every render of a cached image reads its record, so the access time goes to
 * storage at most this often per record. Eviction order after a restart only
 * needs to be roughly right.
 */
const ACCESS_PERSIST_INTERVAL_MS = 60 * 60 * 1000;

const persistedAccessAt = new Map<string, number>();

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

function isCacheableUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function getCacheKey(url: string, variant = 'original'): string {
  return `${hashString(`${variant}:${url}`)}-${variant.replace(/[^a-z0-9_-]/gi, '_')}`;
}

function getRecordStorageKey(key: string): string {
  return `${RECORD_PREFIX}${key}`;
}

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
      // SAFETY: persistRecord is the only writer of these keys and stringifies a CacheRecord.
      const record = JSON.parse(raw) as CacheRecord;

      const previous = manifest.get(record.key);
      manifestTotalBytes += record.size - (previous?.size ?? 0);
      manifest.set(record.key, record);
      persistedAccessAt.set(record.key, record.lastAccessed);
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
  persistedAccessAt.set(record.key, record.lastAccessed);
}

/**
 * Deletes run on the native file queue. A download to the same path must
 * await the pending delete first, or the delete can remove the new file.
 */
const pendingDeletes = new Map<string, Promise<void>>();

async function deleteQuietly(uri: string): Promise<void> {
  try {
    await FileSystemLegacy.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore filesystem cleanup errors.
  }
}

function deleteSoon(uri: string): void {
  const deletion = deleteQuietly(uri).then(() => {
    if (pendingDeletes.get(uri) === deletion) {
      pendingDeletes.delete(uri);
    }
  });

  pendingDeletes.set(uri, deletion);
}

function forgetRecord(key: string): CacheRecord | undefined {
  const record = manifest.get(key);
  manifest.delete(key);
  manifestStorage.remove(getRecordStorageKey(key));
  persistedAccessAt.delete(key);

  if (!record) {
    return undefined;
  }

  manifestTotalBytes -= record.size;
  verifiedFiles.delete(record.uri);
  return record;
}

function removeRecord(key: string): void {
  const record = forgetRecord(key);

  if (record) {
    deleteSoon(record.uri);
  }
}

async function ensureCacheDirectoryAsync(): Promise<Directory> {
  const cacheDir = new Directory(Paths.cache, CACHE_DIR_NAME);
  await pendingDeletes.get(cacheDir.uri);

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

  const persistedAt = persistedAccessAt.get(record.key) ?? 0;

  if (record.lastAccessed - persistedAt >= ACCESS_PERSIST_INTERVAL_MS) {
    persistRecord(record);
  }

  return record.uri;
}

/**
 * File.exists is a synchronous syscall on the JS thread, so trust a successful
 * stat for a while; removeRecord / clearSessionCache still invalidate at once.
 */
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

function drainQueue(): void {
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

        if (task.generation === cacheGeneration) {
          inFlight.delete(task.key);
        }

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
      generation: cacheGeneration,
      key,
      options,
      reject,
      resolve,
      run,
      url,
    });

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

  const targetBytes = MAX_CACHE_BYTES * EVICTION_TARGET_RATIO;
  const targetRecords = Math.floor(MAX_CACHE_RECORDS * EVICTION_TARGET_RATIO);

  const oldestFirst = Array.from(manifest.values())
    .filter(record => record.key !== protectedKey)
    .sort((a, b) => a.lastAccessed - b.lastAccessed);

  for (const record of oldestFirst) {
    if (manifestTotalBytes <= targetBytes && manifest.size <= targetRecords) {
      return;
    }

    removeRecord(record.key);
  }
}

function getFileName(uri: string): string {
  return uri.slice(uri.lastIndexOf('/') + 1);
}

/**
 * Drops records whose file is gone, using one directory listing instead of a
 * synchronous stat per record. Only records that existed before the listing
 * started are checked, because a later download can be missing from it.
 */
async function validateManifest(): Promise<void> {
  const snapshot = Array.from(manifest.values());
  let fileNames: Set<string>;

  try {
    fileNames = new Set(
      await FileSystemLegacy.readDirectoryAsync(getCacheDirectoryPath()),
    );
  } catch {
    // A missing or unreadable directory leaves validation to getValidRecord.
    return;
  }

  snapshot.forEach(record => {
    const isUnchanged = manifest.get(record.key) === record;

    if (isUnchanged && !fileNames.has(getFileName(record.uri))) {
      forgetRecord(record.key);
    }
  });
}

function validateManifestSoon(): void {
  if (validationStarted) {
    return;
  }

  validationStarted = true;

  setTimeout(() => {
    void validateManifest();
  }, 1000);
}

/**
 * Deletes a file that a download from before `clearSessionCache` wrote after
 * the clear removed the directory. Nothing else would delete it. Keep the file
 * when a newer record or download uses the same path.
 */
function discardClearedDownload(key: string, uri: string): void {
  if (manifest.has(key) || inFlight.has(key)) {
    return;
  }

  deleteSoon(uri);
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

  const generation = cacheGeneration;
  const isCleared = () => generation !== cacheGeneration;

  return enqueueDownload(key, url, options, async () => {
    // eslint-disable-next-line react-doctor/async-defer-await -- a clear during this await is what the guard below checks
    const cacheDir = await ensureCacheDirectoryAsync();
    const cachedFile = getCachedFile(cacheDir, key, url);
    await pendingDeletes.get(cachedFile.uri);

    if (isCleared()) {
      return url;
    }

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

      // A parallel download already produced the file, so drop the duplicate.
      const isDuplicate =
        downloadedFile.uri !== cachedFile.uri && cachedFile.exists;

      if (isDuplicate) {
        downloadedFile.delete();
      }

      if (!isDuplicate && downloadedFile.uri !== cachedFile.uri) {
        await downloadedFile.move(cachedFile);
      }

      if (isCleared()) {
        discardClearedDownload(key, cachedFile.uri);
        return url;
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
      if (!isCleared() && cachedFile.exists) {
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
  cacheGeneration += 1;
  taskQueue.splice(0).forEach(task => task.resolve(task.url));
  inFlight.clear();
  verifiedFiles.clear();

  Array.from(manifest.keys()).forEach(forgetRecord);
  deleteSoon(getCacheDirectoryPath());
}

export function listCachedImages(): CachedImageInfo[] {
  hydrateManifest();
  return Array.from(manifest.values());
}

export function getCacheDirectoryPath(): string {
  return new Directory(Paths.cache, CACHE_DIR_NAME).uri;
}
