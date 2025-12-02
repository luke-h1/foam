/**
 * A utility type that ensures an array is not empty.
 *
 * @template T - The type of elements in the array
 * @param arr - The array to check
 * @returns The array if it is not empty, otherwise an error is thrown
 *
 * @example
 * ```typescript
 * type NonEmptyArray = NonEmptyArray<string>;
 * // Returns: [string, ...string[]]
 */
export type NonEmptyArray<T> = [T, ...T[]];
