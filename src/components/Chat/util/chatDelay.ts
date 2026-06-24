// Cap the auto-synced delay so a bogus latency reading can't strand chat behind a huge delay.
export const MAX_AUTO_SYNC_CHAT_DELAY_SECONDS = 30;

/**
 * Effective chat-delay (ms): auto-sync tracks measured latency, else the manual delay.
 * Returns 0 when auto-sync is on but no latency has been measured.
 */
export function resolveEffectiveChatDelayMs(options: {
  autoSync: boolean;
  manualDelaySeconds: number;
  measuredLatencySeconds: number | null;
}): number {
  const { autoSync, manualDelaySeconds, measuredLatencySeconds } = options;

  if (autoSync) {
    if (
      measuredLatencySeconds == null ||
      !Number.isFinite(measuredLatencySeconds) ||
      measuredLatencySeconds <= 0
    ) {
      return 0;
    }
    return (
      Math.min(measuredLatencySeconds, MAX_AUTO_SYNC_CHAT_DELAY_SECONDS) * 1000
    );
  }

  if (!Number.isFinite(manualDelaySeconds)) {
    return 0;
  }
  return Math.max(0, manualDelaySeconds) * 1000;
}
