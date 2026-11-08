export interface ReconnectBackoff {
  baseIntervalMs: number;
  jitterMs: number;
}

export interface ReconnectPolicy extends ReconnectBackoff {
  maxAttempts: number;
}

export interface EventSubReconnectPolicy extends ReconnectBackoff {
  logWarningAfterAttempts: number;
}

const FAST_FIRST_RECONNECT_INTERVAL_MS = 300;

export const IRC_RECONNECT_POLICY: ReconnectPolicy = {
  baseIntervalMs: 2000,
  maxAttempts: 100,
  jitterMs: 250,
};

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

export function getReconnectBackoffMs(
  attempt: number,
  baseIntervalMs: number,
): number {
  if (attempt === 0) {
    return FAST_FIRST_RECONNECT_INTERVAL_MS;
  }

  return Math.round(baseIntervalMs * Math.min(1.5 ** (attempt - 1), 8));
}

export function getReconnectDelay(
  attempt: number,
  policy: ReconnectBackoff,
): number {
  return (
    getReconnectBackoffMs(attempt, policy.baseIntervalMs) +
    Math.random() * policy.jitterMs
  );
}
