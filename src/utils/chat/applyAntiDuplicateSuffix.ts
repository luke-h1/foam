import { MAX_MESSAGE_LENGTH, messageLength } from './maxMessageLength';

// A tag character - no width, no glyph.
const INVISIBLE_SUFFIX = ' \u{E0000}';

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

  // Codepoints, matching the composer's budget: emoji must not read as two.
  if (messageLength(message) + 2 > MAX_MESSAGE_LENGTH) {
    return message;
  }

  return `${message}${INVISIBLE_SUFFIX}`;
}
