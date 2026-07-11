const MAX_MENTION_ENTRIES = 8000;

export function capMentionIndex(index: Map<string, unknown>): void {
  if (index.size <= MAX_MENTION_ENTRIES) {
    return;
  }
  const trimCount = Math.floor(MAX_MENTION_ENTRIES * 0.2);
  let removed = 0;
  for (const key of index.keys()) {
    if (removed >= trimCount) {
      break;
    }
    index.delete(key);
    removed += 1;
  }
}
