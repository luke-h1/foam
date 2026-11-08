import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';

interface SetBoundedMapEntryOptions {
  trimFraction?: number;
}

export function setBoundedMapEntry<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  value: TValue,
  maxSize: number,
  { trimFraction }: SetBoundedMapEntryOptions = {},
): void {
  if (map.has(key)) {
    map.set(key, value);
    return;
  }

  if (trimFraction === undefined || map.size < maxSize) {
    evictOldestWhenFull(map, maxSize);
    map.set(key, value);
    return;
  }

  let trimCount = Math.max(1, Math.floor(maxSize * trimFraction));

  for (const oldestKey of map.keys()) {
    if (trimCount <= 0) {
      break;
    }

    map.delete(oldestKey);
    trimCount -= 1;
  }

  map.set(key, value);
}
