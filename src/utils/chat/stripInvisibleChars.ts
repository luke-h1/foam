/**
 * Twitch chatters append default-ignorable invisibles -- most often U+034F
 * (combining grapheme joiner), also the Chatterino U+E0000 "magic" suffix --
 * to dodge the duplicate-message filter. With no base glyph to attach to they
 * render as tofu "?" boxes on iOS, and when fused to an emote name they stop
 * it matching. Strip the known junk set; never strip U+200D (ZWJ) or
 * U+FE00-FE0F (variation selectors), which compound/presentation emoji need.
 * U+E0000 is matched as its surrogate pair so no /u flag is required (Hermes).
 */
const INVISIBLE_CHARS = /[\u034F\u180E\u200B\u2060\uFEFF]|\uDB40\uDC00/g;

export function stripInvisibleChars(input: string): string {
  return input.replace(INVISIBLE_CHARS, '');
}
