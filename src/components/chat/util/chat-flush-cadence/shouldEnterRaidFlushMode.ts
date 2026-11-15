const RAID_PENDING_THRESHOLD = 8;

export const shouldEnterRaidFlushMode = (
  batchSize: number,
  isAtBottom: boolean,
): boolean => isAtBottom && batchSize > RAID_PENDING_THRESHOLD;
