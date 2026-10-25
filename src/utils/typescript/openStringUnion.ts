/**
 * A union of known string literals that still accepts any other string;
 * `string & {}` keeps autocomplete for the known values alive.
 */
export type OpenStringUnion<T> = T | (string & {});
