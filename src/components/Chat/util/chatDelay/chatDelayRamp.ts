/**
 * How fast the applied delay may grow, in ms of delay per ms of wall time.
 * At 0.5 a jump from 0 to 8s takes 16s, and held messages release at two
 * thirds speed in the meantime instead of stopping for 8s.
 */
const CHAT_DELAY_RAMP_RATE = 0.5;

/**
 * Latency samples jitter by a few hundred ms. Re-timing the queue on each
 * would wobble the delay, so a new target only applies once it moves this far
 * from the current one. Turning the delay off always applies.
 */
const CHAT_DELAY_DEADBAND_MS = 2_000;

/**
 * Smooths increases of the chat delay. The first target applies at once;
 * later increases ramp, decreases apply at once. Without this an 'auto' delay
 * that jumps from 0 to the measured video latency freezes chat for the whole
 * latency, because every new message is held that long and nothing is due.
 */
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

export type ChatDelayRamp = ReturnType<typeof createChatDelayRamp>;
