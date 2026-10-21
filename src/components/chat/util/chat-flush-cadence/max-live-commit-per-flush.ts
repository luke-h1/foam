import { Platform } from 'react-native';

/**
 * Soft floor keeps the visible chat from lagging when traffic is light. Hard
 * ceiling stops a late flush from committing every arrival in one Fabric tree
 * (60+ rows) and dropping frames under a sustained flood.
 *
 * Each soft floor is sized against its own cadence (see pickFlushDelay): raid
 * mode widens the interval, so its floor grows by the same factor.
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
    const soft = raidMode ? 8 : 4;
    const hard = raidMode ? 16 : 10;
    return Math.min(hard, Math.max(soft, arrivalsSinceFlush));
  }

  const soft = raidMode ? 15 : 8;
  const hard = raidMode ? 24 : 16;
  return Math.min(hard, Math.max(soft, arrivalsSinceFlush));
};

/**
 * Chunk size when the ingest buffer hits backpressure. Live flushes stay under
 * the hard ceiling above; without a cap here the catch-up drain would commit
 * the whole backlog (150–400 rows) in one Fabric tree.
 */
export const maxBackpressureCommitPerFlush = (): number =>
  Platform.OS === 'android' ? 32 : 48;
