import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

const MAX_MENTION_ENTRIES = 8000;

/**
 * Writes one mention index entry. A full index drops its oldest fifth at once,
 * so a busy chat does not evict on every write.
 */
export function setMentionIndexEntry<TValue>(
  index: Map<string, TValue>,
  key: string,
  value: TValue,
): void {
  setBoundedMapEntry(index, key, value, MAX_MENTION_ENTRIES, {
    trimFraction: 0.2,
  });
}
