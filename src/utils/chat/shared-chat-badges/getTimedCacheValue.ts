import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

import type { TimedCacheEntry } from './types';

export function getTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
): T | undefined {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.value;
}

export function setTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
  maxEntries: number,
): void {
  const now = Date.now();

  cache.forEach((entry, entryKey) => {
    if (entry.expiresAt <= now) {
      cache.delete(entryKey);
    }
  });

  setBoundedMapEntry(cache, key, { value, expiresAt: now + ttlMs }, maxEntries);
}
