const RAID_PENDING_THRESHOLD = 8;

/**
 * A flush that committed a raid-sized batch while following live should slow the
 * next live flush; a small batch snaps back to the full 100ms liveness.
 */
export const shouldEnterRaidFlushMode = (
  batchSize: number,
  isAtBottom: boolean,
): boolean => isAtBottom && batchSize > RAID_PENDING_THRESHOLD;
