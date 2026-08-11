/**
 * 7TV WebSocket messages encode arrays as objects with numeric keys and a
 * `length` field - paint shadows and gradient stops arrive in this shape.
 */
export interface IndexedCollection<T> {
  [key: number]: T;
  length: number;
}

export function indexedCollectionToArray<T>(
  collection: IndexedCollection<T>,
): T[] {
  const items: T[] = [];
  for (let i = 0; i < collection.length; i += 1) {
    const item = collection[i];
    if (item !== undefined) {
      items.push(item);
    }
  }
  return items;
}
