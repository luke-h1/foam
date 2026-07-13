/**
 * Extends a string-literal union so other strings remain assignable
 * (`string & {}` preserves autocomplete for the known members).
 */
export type OpenStringUnion<T> = T | (string & {});
