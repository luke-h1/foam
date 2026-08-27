import { Platform } from 'react-native';

/**
 * Each cap is sized against its own cadence (see pickFlushDelay): raid mode
 * widens the interval, so its cap grows by the same factor or the drain falls behind.
 */
export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
  raidMode: boolean,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }

  if (Platform.OS === 'android') {
    return raidMode ? 8 : 4;
  }

  return raidMode ? 15 : 8;
};
