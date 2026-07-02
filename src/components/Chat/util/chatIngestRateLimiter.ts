// Caps how many LIVE messages enter the ingest pipeline per second. The
// per-message cost this bounds is now cheap (IRC tags -> base message + buffer
// insert); the expensive emote/badge parse is deferred to commit time and only
// runs for rows that survive raid sampling, so this limiter is a flood
// backstop for buffer/bookkeeping work rather than the display cap. 150/s is
// 5x the old parse-at-ingest cap (30/s): scrollback during a raid is far more
// complete, while a runaway flood still can't monopolise the JS thread. A
// token bucket lets normal/busy chat through untouched and only samples
// sustained floods.
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
