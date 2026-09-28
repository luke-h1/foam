import type { ChatDelaySetting } from '@app/store/preference-store';

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
    return resolveAutoChatDelayMs(measuredVideoLatencySeconds);
  }

  if (setting === 'off' || !Number.isFinite(setting)) {
    return 0;
  }

  return Math.max(0, setting) * 1000;
}

/**
 * Auto-sync holds chat for as long as the player is behind live, capped so a
 * stalled measurement cannot park chat. 0 until the first measurement lands.
 */
function resolveAutoChatDelayMs(
  measuredVideoLatencySeconds: number | null,
): number {
  if (
    measuredVideoLatencySeconds === null ||
    !Number.isFinite(measuredVideoLatencySeconds)
  ) {
    return 0;
  }

  return Math.min(
    Math.max(0, measuredVideoLatencySeconds) * 1000,
    MAX_AUTO_CHAT_DELAY_MS,
  );
}
