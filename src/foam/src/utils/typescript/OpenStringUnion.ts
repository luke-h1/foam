/**
 * A utility type that allows extending a union of string literals with any other string.
 *
 * This is useful when you want to define a union of specific string values but still allow
 * additional custom strings that are not part of the predefined union.
 *
 * @template T - The union of string literals to extend.
 *
 * @example
 * type Status = OpenStringUnion<'active' | 'inactive'>;
 *
 */
export type OpenStringUnion<T> = T | (string & {});
