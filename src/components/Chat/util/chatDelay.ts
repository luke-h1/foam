/**
 * Effective chat-delay (ms) from the manual delay preference. 0 = off.
 */
export function resolveEffectiveChatDelayMs(
  manualDelaySeconds: number,
): number {
  if (!Number.isFinite(manualDelaySeconds)) {
    return 0;
  }
  return Math.max(0, manualDelaySeconds) * 1000;
}
