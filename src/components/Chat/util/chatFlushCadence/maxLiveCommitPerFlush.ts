import { Platform } from 'react-native';

/**
 * Each cap is sized against its own cadence (see pickFlushDelay): raid mode
 * widens the interval, so its cap grows by the same factor or the drain falls behind.
 *
 * The cap never drops below the arrivals since the last flush. A chat that
 * sends more than the cap per interval would otherwise back up in the buffer
 * and the visible chat would lag live by seconds.
 */
export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
  raidMode: boolean,
  arrivalsSinceFlush = 0,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }

  if (Platform.OS === 'android') {
    return Math.max(raidMode ? 8 : 4, arrivalsSinceFlush);
  }

  return Math.max(raidMode ? 15 : 8, arrivalsSinceFlush);
};
