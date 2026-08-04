// Each flush mounts its rows in one reconciliation, so a 200 msg/s raid
// committing ~20 rows at once is a single very heavy frame that caps scroll
// fps (issue #594). Cap the rows a live flush commits and leave the overflow
// buffered: the next flush 100ms later picks it up, so the frame stays cheap
// without the chat silently losing messages. Normal busy chat is ≤2 per flush
// and never reaches the cap. Off the bottom there is no frame to protect - the
// backlog commits whole.
const MAX_LIVE_COMMIT_PER_FLUSH = 6;

/**
 * How many buffered rows this flush may commit, or `undefined` for all of them.
 */
export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
): number | undefined => (isAtBottom ? MAX_LIVE_COMMIT_PER_FLUSH : undefined);
