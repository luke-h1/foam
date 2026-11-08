import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

const MAX_MENTION_ENTRIES = 8000;

export function setMentionIndexEntry<TValue>(
  index: Map<string, TValue>,
  key: string,
  value: TValue,
): void {
  setBoundedMapEntry(index, key, value, MAX_MENTION_ENTRIES, {
    trimFraction: 0.2,
  });
}
