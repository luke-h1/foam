export interface ReconnectBackoff {
  baseIntervalMs: number;
  jitterMs: number;
}

export interface ReconnectPolicy extends ReconnectBackoff {
  maxAttempts: number;
}

/**
 * The EventSub socket never stops retrying. After `logWarningAfterAttempts`
 * it logs one warning and keeps retrying at the capped delay.
 */
export interface EventSubReconnectPolicy extends ReconnectBackoff {
  logWarningAfterAttempts: number;
}

const FAST_FIRST_RECONNECT_INTERVAL_MS = 300;

/**
 * A long outage exhausted 30 attempts in about 7 minutes and left chat dead
 * until remount. The backoff caps at about 16s, so a higher ceiling only
 * retries for longer.
 */
export const IRC_RECONNECT_POLICY: ReconnectPolicy = {
  baseIntervalMs: 2000,
  maxAttempts: 100,
  jitterMs: 250,
};

/**
 * Per-outage budget. The counter resets on every successful open, and a
 * foreground transition revives an exhausted socket.
 */
export const SEVEN_TV_RECONNECT_POLICY: ReconnectPolicy = {
  baseIntervalMs: 1000,
  maxAttempts: 60,
  jitterMs: 250,
};

export const EVENTSUB_RECONNECT_POLICY: EventSubReconnectPolicy = {
  baseIntervalMs: 2000,
  logWarningAfterAttempts: 10,
  jitterMs: 250,
};

/**
 * Exponential backoff from the policy base, capped at eight times the base.
 * The first attempt is near-instant because most drops are transient.
 */
export function getReconnectBackoffMs(
  attempt: number,
  baseIntervalMs: number,
): number {
  if (attempt === 0) {
    return FAST_FIRST_RECONNECT_INTERVAL_MS;
  }

  return Math.round(baseIntervalMs * Math.min(1.5 ** (attempt - 1), 8));
}

/**
 * The backoff plus random jitter, so clients that dropped together do not
 * reconnect together.
 */
export function getReconnectDelay(
  attempt: number,
  policy: ReconnectBackoff,
): number {
  return (
    getReconnectBackoffMs(attempt, policy.baseIntervalMs) +
    Math.random() * policy.jitterMs
  );
}
