/**
 * Drops the oldest key once a Map reaches `maxSize`, so a cache stays bounded
 * without the bookkeeping of a real LRU. Map iteration order is insertion
 * order, so the first key is the oldest write.
 */
export function evictOldestWhenFull<TKey, TValue>(
  cache: Map<TKey, TValue>,
  maxSize: number,
): void {
  if (cache.size < maxSize) {
    return;
  }

  const oldestKey = cache.keys().next().value;

  if (oldestKey !== undefined) {
    cache.delete(oldestKey);
  }
}
