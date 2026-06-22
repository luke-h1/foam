// Each flush commits a new Fabric shadow tree for the chat list, and at high
// message rates releasing the dead trees dominated the Hermes GC thread
// (issue #594). 100ms still reads as live (10 updates/s) and cut app CPU by
// ~40% on an 18k-viewer chat; at moderate rates it measures neutral.
export const LIVE_BUFFER_FLUSH_INTERVAL_MS = 100;
export const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 250;
// Under a raid the cost that drops frames is the per-flush list reconcile, which
// fires every LIVE interval (10x/s) regardless of how few rows each commits — so
// halving the flush rate halves the jank opportunities. We only slow down once a
// flush has seen a raid-sized batch (RAID_PENDING_THRESHOLD), and snap back to
// 100ms the moment batches shrink, so normal/busy chat stays at full liveness.
// Fewer, larger-gap commits are also strictly better for GC (issue #594).
export const RAID_BUFFER_FLUSH_INTERVAL_MS = 180;
export const RAID_PENDING_THRESHOLD = 8;
// While a drag or fling is in progress away from the bottom, publishing a
// flush re-keys rows and forces maintainVisibleContentPosition adjustments
// mid-gesture, dropping frames. Hold the buffer and retry once the gesture
// settles; the buffer cap equals the store cap so nothing extra is lost.
export const SCROLL_DEFERRED_FLUSH_RETRY_MS = 250;
// Raid sampling: when following live, a 200 msg/s raid buffers ~20 messages per
// 100ms flush, so React mounts ~20 new rows in a single reconciliation — one
// very heavy frame that caps scroll fps. Nobody can read 200 msg/s anyway, so
// cap the rows committed per live flush and drop the older overflow (it would
// have scrolled past unread). 3 rows per 100ms flush (~30 msg/s) keeps each
// flush-frame affordable under a raid while staying invisible to normal busy
// chat (which is ≤2/flush). Combined with the ingestion limiter the chat does
// bounded work no matter how fast a raid arrives. Only applies at the bottom,
// and keeps the one-flush-per-100ms cadence (issue #594 GC win).
export const MAX_LIVE_COMMIT_PER_FLUSH = 3;

/**
 * A flush that committed a raid-sized batch while following live should slow the
 * next live flush; a small batch snaps back to the full 100ms liveness.
 */
export const shouldEnterRaidFlushMode = (
  batchSize: number,
  isAtBottom: boolean,
): boolean => isAtBottom && batchSize > RAID_PENDING_THRESHOLD;

/**
 * Pick the flush delay: live (or slowed live, under a raid) when following the
 * bottom, the wider backlog window when reading scrollback.
 */
export const pickFlushDelay = ({
  isAtBottom,
  raidMode,
  scrollingToBottom,
}: {
  isAtBottom: boolean;
  raidMode: boolean;
  scrollingToBottom: boolean;
}): number => {
  const liveDelay = raidMode
    ? RAID_BUFFER_FLUSH_INTERVAL_MS
    : LIVE_BUFFER_FLUSH_INTERVAL_MS;
  return isAtBottom || scrollingToBottom
    ? liveDelay
    : BACKLOG_BUFFER_FLUSH_INTERVAL_MS;
};

/**
 * When following a raid live, commit only the newest rows and drop the older
 * overflow (it would have scrolled past unread). Off the bottom, every buffered
 * row is kept so backlog stays complete.
 */
export const sampleLiveCommit = <T>(messages: T[], isAtBottom: boolean): T[] =>
  isAtBottom && messages.length > MAX_LIVE_COMMIT_PER_FLUSH
    ? messages.slice(-MAX_LIVE_COMMIT_PER_FLUSH)
    : messages;
