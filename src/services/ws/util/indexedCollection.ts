/**
 * A collection of items with numeric indices and a length property.
 *
 * This structure is used by 7TV WebSocket messages to represent arrays
 * in a JSON-object format. It's commonly used for shadows and gradient stops.
 *
 * @typeParam T - The type of items stored in the collection.
 *
 * @example
 * ```typescript
 * // Example from 7TV WebSocket message:
 * const stops: IndexedCollection<PaintStop> = {
 *   "0": { at: 0, color: -1675056641 },
 *   "1": { at: 0.5, color: 1560255231 },
 *   "2": { at: 1, color: 576286207 },
 *   "length": 3
 * };
 * ```
 */
export interface IndexedCollection<T> {
  [key: number]: T;
  length: number;
}

/**
 * Type guard to check if a value is an IndexedCollection.
 *
 * @typeParam T - The expected type of items in the collection.
 * @param value - The value to check.
 * @returns `true` if the value is an IndexedCollection, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isIndexedCollection<PaintStop>(data.stops)) {
 *   const stopsArray = indexedCollectionToArray(data.stops);
 * }
 * ```
 */
export function isIndexedCollection<T>(
  value: unknown,
): value is IndexedCollection<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    typeof (value as IndexedCollection<T>).length === 'number'
  );
}

/**
 * Converts an IndexedCollection to a standard TypeScript array.
 *
 * This utility handles the conversion from 7TV's object-based array format
 * to a native array, filtering out any undefined indices.
 *
 * @typeParam T - The type of items in the collection.
 * @param collection - The IndexedCollection to convert.
 * @returns A typed array containing all defined items from the collection.
 *
 * @example
 * ```typescript
 * const stops: IndexedCollection<PaintStop> = { "0": stop1, "1": stop2, "length": 2 };
 * const stopsArray: PaintStop[] = indexedCollectionToArray(stops);
 * // Result: [stop1, stop2]
 * ```
 */
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
