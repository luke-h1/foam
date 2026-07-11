import type { ChatDelaySetting } from '@app/store/preferenceStore';

// Cap on the auto-sync hold so a stalled measurement can't park chat for minutes.
export const MAX_AUTO_CHAT_DELAY_MS = 30_000;

/**
 * Effective chat-delay (ms) for a delay setting. 'auto' follows the measured
 * video latency and is 0 until the first measurement lands. 0 = no delay.
 */
export function resolveEffectiveChatDelayMs(
  setting: ChatDelaySetting,
  measuredVideoLatencySeconds: number | null,
): number {
  if (setting === 'auto') {
    if (
      typeof measuredVideoLatencySeconds !== 'number' ||
      !Number.isFinite(measuredVideoLatencySeconds)
    ) {
      return 0;
    }
    return Math.min(
      Math.max(0, measuredVideoLatencySeconds) * 1000,
      MAX_AUTO_CHAT_DELAY_MS,
    );
  }
  if (setting === 'off' || !Number.isFinite(setting)) {
    return 0;
  }
  return Math.max(0, setting) * 1000;
}
