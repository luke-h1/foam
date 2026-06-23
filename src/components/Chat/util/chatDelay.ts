// A bogus latency reading shouldn't strand chat behind a huge delay; cap the
// auto-synced delay at a sane ceiling (well above any real broadcaster latency).
export const MAX_AUTO_SYNC_CHAT_DELAY_SECONDS = 30;

/**
 * Resolves the effective chat-delay in milliseconds from the user's preferences
 * and the player's measured latency (Frosty's `effectiveChatDelay`): auto-sync
 * tracks the measured broadcaster latency, otherwise the fixed manual delay.
 * Returns 0 (no delay — today's path) when auto-sync is on but no latency has
 * been measured yet.
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
