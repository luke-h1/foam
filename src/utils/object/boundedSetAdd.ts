export function boundedSetAdd(
  set: Set<string>,
  key: string,
  max: number,
): void {
  set.add(key);
  if (set.size <= max) {
    return;
  }
  const oldest = set.values().next().value;
  if (oldest !== undefined) {
    set.delete(oldest);
  }
}
