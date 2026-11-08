import type { ChatDelaySetting } from '@app/store/preference-store';

// Cap on the auto-sync hold so a stalled measurement can't park chat for minutes.
const MAX_AUTO_CHAT_DELAY_MS = 30_000;

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
