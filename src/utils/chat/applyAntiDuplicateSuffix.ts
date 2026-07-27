/**
 * A tag character: it carries no width and no glyph, so it changes the payload
 * Twitch compares without changing what anyone reads.
 */
const INVISIBLE_SUFFIX = ' \u{E0000}';

/**
 * Twitch silently drops a message identical to the sender's previous one within
 * about 30 seconds, with no error back to the client - the message simply never
 * appears. Appending the invisible suffix makes the repeat distinct.
 *
 * `lastSent` is what was actually put on the wire, so consecutive repeats
 * alternate between the plain and suffixed form and never collide.
 */
export function applyAntiDuplicateSuffix(
  message: string,
  lastSent: string | undefined,
): string {
  if (!lastSent || message !== lastSent) {
    return message;
  }

  return `${message}${INVISIBLE_SUFFIX}`;
}
