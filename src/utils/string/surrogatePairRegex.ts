/**
 * Matches any UTF-16 surrogate code unit. A match means the string holds an
 * astral character, so it must be iterated by code point (`[...str]`) rather
 * than by char index.
 */
export const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;
