import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';

export function setBoundedMapEntry<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  value: TValue,
  maxSize: number,
): void {
  if (!map.has(key)) {
    evictOldestWhenFull(map, maxSize);
  }

  map.set(key, value);
}
