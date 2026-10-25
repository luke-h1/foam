/**
 * Twitch's per-message ceiling, counted in codepoints. Shared so the composer's
 * limit and the anti-duplicate suffix cannot drift apart.
 */
export const MAX_MESSAGE_LENGTH = 500;

export function messageLength(message: string): number {
  return [...message].length;
}
