// Each flush mounts its rows in one reconciliation, so an unbounded raid batch
// is a single very heavy frame that caps scroll fps (issue #594). Cap the rows
// a live flush commits and leave the overflow buffered for the next one, so the
// frame stays cheap without chat losing messages. Normal busy chat is ≤2 per
// flush and never reaches the cap; off the bottom there is no frame to protect.
//
// Each cap is sized against its own cadence (see pickFlushDelay) so both drain
// ~60 msg/s. Raid mode makes commits fewer and larger for GC; it must not make
// them slower, or the backlog outruns the drain.
const MAX_LIVE_COMMIT_PER_FLUSH = 6;
const MAX_RAID_COMMIT_PER_FLUSH = 11;

/**
 * How many buffered rows this flush may commit, or `undefined` for all of them.
 */
export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
  raidMode: boolean,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }
  return raidMode ? MAX_RAID_COMMIT_PER_FLUSH : MAX_LIVE_COMMIT_PER_FLUSH;
};
