/**
 * Flood backstop on live-message ingest. Sits above the highest sustained
 * single-channel rates seen on Twitch (100-200/s at the largest events), so
 * it only samples a flood the commit path could not render anyway. Drops are
 * reported to Sentry.
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
