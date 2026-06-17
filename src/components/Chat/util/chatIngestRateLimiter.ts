// Caps how many LIVE messages get fully processed (emote/badge parse + store
// insert) per second. Above this the JS thread can't keep up and the viewer
// can't read it anyway, so excess live messages are dropped *before* the
// expensive parse — saving far more than dropping them at render time. A token
// bucket lets normal/busy chat through untouched (it stays under the limit) and
// only samples during raids, where dropping is unavoidable.
//
// The limit sits just above the live render rate (MAX_LIVE_COMMIT_PER_FLUSH ×
// 10/s) so there's no point processing messages that would only be dropped at
// the flush anyway.
const MAX_PROCESSED_PER_SEC = 30;
const BUCKET_SIZE = 10;

let tokens = BUCKET_SIZE;
let lastRefill = 0;

export function shouldProcessLiveMessage(): boolean {
  const now = performance.now();
  if (lastRefill === 0) {
    lastRefill = now;
  }
  tokens = Math.min(
    BUCKET_SIZE,
    tokens + ((now - lastRefill) / 1000) * MAX_PROCESSED_PER_SEC,
  );
  lastRefill = now;

  if (tokens >= 1) {
    tokens -= 1;
    return true;
  }
  return false;
}

export function resetChatIngestRateLimiter(): void {
  tokens = BUCKET_SIZE;
  lastRefill = 0;
}
