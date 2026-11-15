/**
 * How fast the applied delay may grow, in ms of delay per ms of wall time.
 */
const CHAT_DELAY_RAMP_RATE = 0.5;

const CHAT_DELAY_DEADBAND_MS = 2000;

export const createChatDelayRamp = (
  rate = CHAT_DELAY_RAMP_RATE,
  deadbandMs = CHAT_DELAY_DEADBAND_MS,
) => {
  let targetDelayMs: number | null = null;
  let appliedDelayMs: number | null = null;
  let lastResolvedAt = 0;

  return {
    resolve(requestedDelayMs: number, now: number): number {
      if (
        targetDelayMs === null ||
        requestedDelayMs <= 0 ||
        Math.abs(requestedDelayMs - targetDelayMs) >= deadbandMs
      ) {
        targetDelayMs = requestedDelayMs;
      }

      if (appliedDelayMs === null || targetDelayMs <= appliedDelayMs) {
        appliedDelayMs = targetDelayMs;
      } else {
        appliedDelayMs = Math.min(
          targetDelayMs,
          appliedDelayMs + (now - lastResolvedAt) * rate,
        );
      }

      lastResolvedAt = now;
      return appliedDelayMs;
    },
    reset(): void {
      targetDelayMs = null;
      appliedDelayMs = null;
      lastResolvedAt = 0;
    },
  };
};
