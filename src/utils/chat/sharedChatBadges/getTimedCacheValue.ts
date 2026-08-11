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
  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });

  if (cache.size <= maxEntries) {
    return;
  }
  const dropCount = cache.size - maxEntries;
  let dropped = 0;
  for (const oldestKey of cache.keys()) {
    if (dropped >= dropCount) {
      break;
    }
    cache.delete(oldestKey);
    dropped += 1;
  }
}
