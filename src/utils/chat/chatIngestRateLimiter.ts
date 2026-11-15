/**
 * Sits above the highest sustained single-channel Twitch rates (100-200/s
 * at the largest events).
 */
export const MAX_INGESTED_PER_SEC = 300;

const BUCKET_SIZE = 60;

let tokens = BUCKET_SIZE;
let lastRefill = 0;

export function shouldProcessLiveMessage(): boolean {
  const now = performance.now();

  if (lastRefill === 0) {
    lastRefill = now;
  }

  tokens = Math.min(
    BUCKET_SIZE,
    tokens + ((now - lastRefill) / 1000) * MAX_INGESTED_PER_SEC,
  );

  lastRefill = now;

  if (tokens >= 1) {
    tokens -= 1;
    return true;
  }

  return false;
}
