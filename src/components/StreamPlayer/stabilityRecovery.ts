export const STALL_RECOVERY_GRACE_MS = 4_000;
export const AUTO_REFRESH_WINDOW_MS = 120_000;
export const MAX_AUTO_REFRESHES_PER_WINDOW = 3;
export const HIGH_LATENCY_RECOVERY_S = 20;
export const HIGH_LATENCY_READINGS_BEFORE_RECOVERY = 3;

export type StabilityRefreshReason =
  'highLatency' | 'stall' | 'videoElementError';

interface StabilityRecoveryOptions {
  now?: () => number;
  onGiveUp: (reason: StabilityRefreshReason, refreshCount: number) => void;
  onRefresh: (reason: StabilityRefreshReason, attempt: number) => void;
}

/**
 * Decides when a stall, video-element error, or sustained high latency should
 * force a WebView refresh, and when to give up because refreshing isn't
 * helping. Refreshes are capped per rolling window; side effects stay with the
 * caller via onRefresh/onGiveUp.
 */
export function createStabilityRecovery({
  now = Date.now,
  onGiveUp,
  onRefresh,
}: StabilityRecoveryOptions) {
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  let refreshTimes: number[] = [];
  let highLatencyReadings = 0;
  let gaveUp = false;

  const clearStallTimer = () => {
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
  };

  const requestRefresh = (reason: StabilityRefreshReason) => {
    const at = now();
    refreshTimes = refreshTimes.filter(
      timestamp => at - timestamp < AUTO_REFRESH_WINDOW_MS,
    );
    highLatencyReadings = 0;

    if (refreshTimes.length >= MAX_AUTO_REFRESHES_PER_WINDOW) {
      if (!gaveUp) {
        gaveUp = true;
        onGiveUp(reason, refreshTimes.length);
      }
      return;
    }

    gaveUp = false;
    refreshTimes.push(at);
    onRefresh(reason, refreshTimes.length);
  };

  return {
    noteStalled() {
      if (!stallTimer) {
        stallTimer = setTimeout(() => {
          stallTimer = null;
          requestRefresh('stall');
        }, STALL_RECOVERY_GRACE_MS);
      }
    },
    notePlaying() {
      clearStallTimer();
      highLatencyReadings = 0;
    },
    noteRecovered() {
      clearStallTimer();
      highLatencyReadings = 0;
    },
    noteVideoError() {
      clearStallTimer();
      requestRefresh('videoElementError');
    },
    noteLatency(latencySeconds: number) {
      if (latencySeconds >= HIGH_LATENCY_RECOVERY_S) {
        highLatencyReadings += 1;
        if (highLatencyReadings >= HIGH_LATENCY_READINGS_BEFORE_RECOVERY) {
          requestRefresh('highLatency');
        }
      } else {
        highLatencyReadings = 0;
      }
    },
    reset() {
      clearStallTimer();
      refreshTimes = [];
      highLatencyReadings = 0;
      gaveUp = false;
    },
    dispose() {
      clearStallTimer();
    },
  };
}

export type StabilityRecovery = ReturnType<typeof createStabilityRecovery>;
