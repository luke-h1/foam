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
    globalThis.caches !== undefined &&
    globalThis.fetch !== undefined &&
    globalThis.URL !== undefined
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
  for (const url of urls) {
    if (!isCacheableWebUri(url)) {
      continue;
    }
    if (getCachedImageUri(url)) {
      continue;
    }
    void cacheImageFromUrl(url, options);
  }
}
