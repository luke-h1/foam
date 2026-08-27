/**
 * Strips duplicate-filter-dodging invisibles that render as tofu and break
 * emote matching; never strip U+200D or U+FE00-FE0F, which emoji need.
 */
const INVISIBLE_CHARS = /[\u034F\u180E\u200B\u2060\uFEFF]|\uDB40\uDC00/g;

export function stripInvisibleChars(input: string): string {
  return input.replace(INVISIBLE_CHARS, '');
}
