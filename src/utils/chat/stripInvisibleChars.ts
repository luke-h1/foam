/**
 * U+E0000, a tag character with no width and no glyph.
 */
export const INVISIBLE_TAG_CHAR = '\u{E0000}';

/**
 * Strips duplicate-filter-dodging invisibles that render as tofu and break
 * emote matching; never strip U+200D or U+FE00-FE0F, which emoji need.
 */
const INVISIBLE_CHARS = new RegExp(
  `[\\u034F\\u180E\\u200B\\u2060\\uFEFF]|${INVISIBLE_TAG_CHAR}`,
  'g',
);

export function stripInvisibleChars(input: string): string {
  return input.replaceAll(INVISIBLE_CHARS, '');
}
