import { isLowFlushBudgetPlatform } from './isLowFlushBudgetPlatform';

export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
  raidMode: boolean,
  arrivalsSinceFlush = 0,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }

  if (isLowFlushBudgetPlatform()) {
    const soft = raidMode ? 8 : 4;
    const hard = raidMode ? 16 : 10;
    return Math.min(hard, Math.max(soft, arrivalsSinceFlush));
  }

  const soft = raidMode ? 15 : 8;
  const hard = raidMode ? 24 : 16;
  return Math.min(hard, Math.max(soft, arrivalsSinceFlush));
};

export const maxBackpressureCommitPerFlush = (): number =>
  isLowFlushBudgetPlatform() ? 32 : 48;
