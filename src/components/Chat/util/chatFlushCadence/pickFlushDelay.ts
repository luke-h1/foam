/**
 * Each flush commits a new Fabric shadow tree (issue #594); 100ms still reads
 * as live and cut app CPU by ~40% on an 18k-viewer chat.
 */
const LIVE_BUFFER_FLUSH_INTERVAL_MS = 100;
const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 250;
const RAID_BUFFER_FLUSH_INTERVAL_MS = 180;

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
