/**
 * Twitch's per-message ceiling, counted in codepoints.
 */
export const MAX_MESSAGE_LENGTH = 500;

export function messageLength(message: string): number {
  return [...message].length;
}
