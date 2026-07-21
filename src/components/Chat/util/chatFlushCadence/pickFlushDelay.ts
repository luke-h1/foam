/**
 * Each flush commits a new Fabric shadow tree for the chat list, and at high
 * message rates releasing the dead trees dominated the Hermes GC thread
 * (issue #594). 100ms still reads as live (10 updates/s) and cut app CPU by
 * ~40% on an 18k-viewer chat; at moderate rates it measures neutral.
 */
const LIVE_BUFFER_FLUSH_INTERVAL_MS = 100;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 250;
/**
 * Under a raid the cost that drops frames is the per-flush list reconcile, which
 * fires every LIVE interval (10x/s) regardless of how few rows each commits - so
 * halving the flush rate halves the jank opportunities. We only slow down once a
 * flush has seen a raid-sized batch (RAID_PENDING_THRESHOLD), and snap back to
 * 100ms the moment batches shrink, so normal/busy chat stays at full liveness.
 * Fewer, larger-gap commits are also strictly better for GC (issue #594).
 */
const RAID_BUFFER_FLUSH_INTERVAL_MS = 180;

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
