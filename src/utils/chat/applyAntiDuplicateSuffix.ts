// A tag character - no width, no glyph.
const INVISIBLE_SUFFIX = ' \u{E0000}';

/**
 * Twitch's message ceiling. Appending the suffix past it would trade a
 * duplicate-drop for a length-drop.
 */
const MAX_MESSAGE_LENGTH = 500;

/**
 * Twitch silently drops a message identical to the sender's previous one within
 * ~30s, with no error back. `lastSent` is what actually went on the wire, so
 * repeats alternate between the plain and suffixed form and never collide.
 */
export function applyAntiDuplicateSuffix(
  message: string,
  lastSent: string | undefined,
): string {
  if (!lastSent || message !== lastSent) {
    return message;
  }

  if (message.length + INVISIBLE_SUFFIX.length > MAX_MESSAGE_LENGTH) {
    return message;
  }

  return `${message}${INVISIBLE_SUFFIX}`;
}
