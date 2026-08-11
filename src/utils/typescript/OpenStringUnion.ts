/**
 * A union of known string literals that still accepts any other string.
 * `string & {}` keeps the literals from being absorbed into `string`, so
 * autocomplete for the known values survives.
 */
export type OpenStringUnion<T> = T | (string & {});
