/**
 * How the visible messages changed since the last batch went to the native
 * list. Chat mostly drops rows from the top and adds rows at the bottom, so
 * that case is sent as a small incremental batch; anything else resets.
 */
export type NativeChatRowsDiff<T> =
  | { kind: 'reset' }
  | {
      kind: 'incremental';
      removeFromStart: number;
      appended: T[];
    };

/**
 * Compares two message windows by key.
 */
export function diffNativeChatRows<T extends object>(
  previous: readonly T[],
  next: readonly T[],
  getKey: (item: T) => string,
): NativeChatRowsDiff<T> {
  const firstNext = next[0];

  if (previous.length === 0 || !firstNext) {
    return { kind: 'reset' };
  }

  const firstNextKey = getKey(firstNext);
  const removeFromStart = previous.findIndex(
    item => getKey(item) === firstNextKey,
  );

  const overlap = previous.length - removeFromStart;

  if (removeFromStart === -1 || overlap > next.length) {
    return { kind: 'reset' };
  }

  for (let index = 0; index < overlap; index += 1) {
    const before = previous[removeFromStart + index];
    const after = next[index];

    if (!before || !after || getKey(before) !== getKey(after)) {
      return { kind: 'reset' };
    }
  }

  return {
    kind: 'incremental',
    removeFromStart,
    appended: next.slice(overlap),
  };
}
