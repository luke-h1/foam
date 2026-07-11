// Flood backstop on live-message ingest. The emote/badge parse is deferred to
// commit time, so 150/s only bounds cheap buffer/bookkeeping work; the token
// bucket lets normal/busy chat through untouched and samples sustained floods.
const MAX_INGESTED_PER_SEC = 150;
const BUCKET_SIZE = 30;

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
