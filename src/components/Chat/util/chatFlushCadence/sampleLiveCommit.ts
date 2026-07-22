/**
 * Raid sampling: when following live, a 200 msg/s raid buffers ~20 messages per
 * 100ms flush, so React mounts ~20 new rows in a single reconciliation - one
 * very heavy frame that caps scroll fps. Nobody can read 200 msg/s anyway, so
 * cap the rows committed per live flush and drop the older overflow (it would
 * have scrolled past unread). 3 rows per 100ms flush (~30 msg/s) keeps each
 * flush-frame affordable under a raid while staying invisible to normal busy
 * chat (which is ≤2/flush). Combined with the ingestion limiter the chat does
 * bounded work no matter how fast a raid arrives. Only applies at the bottom,
 * and keeps the one-flush-per-100ms cadence (issue #594 GC win).
 */
const MAX_LIVE_COMMIT_PER_FLUSH = 3;

/**
 * When following a raid live, commit only the newest rows and drop the older
 * overflow (it would have scrolled past unread). Off the bottom, every buffered
 * row is kept so backlog stays complete.
 */
export const sampleLiveCommit = <T>(messages: T[], isAtBottom: boolean): T[] =>
  isAtBottom && messages.length > MAX_LIVE_COMMIT_PER_FLUSH
    ? messages.slice(-MAX_LIVE_COMMIT_PER_FLUSH)
    : messages;
