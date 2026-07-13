/**
 * 7TV WebSocket arrays arrive as objects with numeric keys plus `length`
 * (used for shadows and gradient stops).
 */
export interface IndexedCollection<T> {
  [key: number]: T;
  length: number;
}

export function indexedCollectionToArray<T>(
  collection: IndexedCollection<T>,
): T[] {
  const result: T[] = [];
  for (let i = 0; i < collection.length; i += 1) {
    if (collection[i] !== undefined) {
      result.push(collection[i] as T);
    }
  }
  return result;
}
