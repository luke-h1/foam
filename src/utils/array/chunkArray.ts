/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @template T - The type of elements in the array
 * @param arr - The array to be chunked
 * @param size - The size of each chunk (must be greater than 0)
 * @returns An array of arrays, where each sub-array contains at most `size` elements
 *
 * @example
 * ```typescript
 * chunkArray([1, 2, 3, 4, 5], 2)
 * // Returns: [[1, 2], [3, 4], [5]]
 *
 * chunkArray(['a', 'b', 'c', 'd'], 3)
 * // Returns: [['a', 'b', 'c'], ['d']]
 * ```
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
