import { MAX_MESSAGE_LENGTH, messageLength } from './maxMessageLength';
import { INVISIBLE_TAG_CHAR } from './stripInvisibleChars';

const INVISIBLE_SUFFIX = ` ${INVISIBLE_TAG_CHAR}`;

/**
 * Twitch silently drops a message identical to the sender's previous one
 * within ~30s; repeats alternate plain and suffixed form so they never collide.
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
