export const BLURHASH = 'LBDbA}oL00Na~B9u57={XRay-Uj[';

export interface CachedImageInfo {
  uri: string;
  name: string;
  size: number;
}

export type ImageCachePriority = 'visible' | 'interactive' | 'background';

export type CacheImageOptions = {
  priority?: ImageCachePriority;
  signal?: AbortSignal;
  variant?: string;
};

const WEB_IMAGE_CACHE_NAME = 'foam-image-cache-v1';
const MAX_MEMORY_CACHE_ENTRIES = 750;
const objectUrlCache = new Map<string, CachedImageInfo>();

function isCacheableWebUri(uri: string | undefined): uri is string {
  return typeof uri === 'string' && /^https?:\/\//i.test(uri);
}

function canUseWebImageCache() {
  return (
    typeof globalThis.caches !== 'undefined' &&
    typeof globalThis.fetch !== 'undefined' &&
    typeof globalThis.URL !== 'undefined'
  );
}

function getCachedName(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() || url;
  } catch {
    return url;
  }
}

function rememberObjectUrl(url: string, objectUrl: string, size: number) {
  const existing = objectUrlCache.get(url);
  if (existing?.uri === objectUrl) {
    return existing.uri;
  }

  if (existing?.uri.startsWith('blob:')) {
    globalThis.URL.revokeObjectURL(existing.uri);
  }

  objectUrlCache.set(url, {
    name: getCachedName(url),
    size,
    uri: objectUrl,
  });

  while (objectUrlCache.size > MAX_MEMORY_CACHE_ENTRIES) {
    const oldestEntry = objectUrlCache.entries().next().value;
    if (!oldestEntry) {
      break;
    }

    const [oldUrl, oldEntry] = oldestEntry;
    if (oldEntry.uri.startsWith('blob:')) {
      globalThis.URL.revokeObjectURL(oldEntry.uri);
    }
    objectUrlCache.delete(oldUrl);
  }

  return objectUrl;
}

export function cacheBase64Image(base64: string): string {
  return base64.startsWith('data:')
    ? base64
    : `data:image/png;base64,${base64}`;
}

export async function cacheImageFromUrl(
  url: string,
  options: CacheImageOptions = {},
): Promise<string> {
  if (!isCacheableWebUri(url) || !canUseWebImageCache()) {
    return url;
  }
  if (options.signal?.aborted) {
    return url;
  }

  const cachedObjectUrl = objectUrlCache.get(url)?.uri;
  if (cachedObjectUrl) {
    return cachedObjectUrl;
  }

  try {
    const cache = await globalThis.caches.open(WEB_IMAGE_CACHE_NAME);
    let response = await cache.match(url);

    if (!response) {
      const fetched = await globalThis.fetch(url, { cache: 'force-cache' });
      if (!fetched.ok) {
        return url;
      }
      await cache.put(url, fetched.clone());
      response = fetched;
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return url;
    }

    return rememberObjectUrl(
      url,
      globalThis.URL.createObjectURL(blob),
      blob.size,
    );
  } catch {
    return url;
  }
}

export function getCachedImageUri(
  url?: string,
  _options: Pick<CacheImageOptions, 'variant'> = {},
): string | null {
  return url ? (objectUrlCache.get(url)?.uri ?? null) : null;
}

export function getCachedImageAsBase64(fileUri: string): string {
  return fileUri;
}

export function deleteCachedImageByUrl(
  url?: string,
  _options: Pick<CacheImageOptions, 'variant'> = {},
): void {
  if (!url) {
    return;
  }

  const cached = objectUrlCache.get(url);
  if (cached?.uri.startsWith('blob:')) {
    globalThis.URL.revokeObjectURL(cached.uri);
  }
  objectUrlCache.delete(url);

  if (canUseWebImageCache()) {
    void globalThis.caches
      .open(WEB_IMAGE_CACHE_NAME)
      .then(cache => cache.delete(url))
      .catch(() => undefined);
  }
}

export function deleteCachedImage(fileUri?: string): void {
  if (!fileUri) {
    return;
  }

  for (const [url, cached] of objectUrlCache) {
    if (cached.uri !== fileUri) {
      continue;
    }

    if (cached.uri.startsWith('blob:')) {
      globalThis.URL.revokeObjectURL(cached.uri);
    }
    objectUrlCache.delete(url);
    break;
  }
}

export function clearSessionCache(): void {
  objectUrlCache.forEach(entry => {
    if (entry.uri.startsWith('blob:')) {
      globalThis.URL.revokeObjectURL(entry.uri);
    }
  });
  objectUrlCache.clear();

  if (typeof globalThis.caches !== 'undefined') {
    void globalThis.caches.delete(WEB_IMAGE_CACHE_NAME).catch(() => undefined);
  }
}

export function listCachedImages(): CachedImageInfo[] {
  return Array.from(objectUrlCache.values());
}

export function getCacheDirectoryPath(): string {
  return WEB_IMAGE_CACHE_NAME;
}

export function warmImageCache(
  urls: string[],
  options: CacheImageOptions = {},
): void {
  urls
    .filter(isCacheableWebUri)
    .filter(url => !getCachedImageUri(url))
    .forEach(url => {
      void cacheImageFromUrl(url, options);
    });
}
