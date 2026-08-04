import { Platform } from 'react-native';

/**
 * How many buffered rows this flush may commit, or `undefined` for all of them.
 *
 * A flush mounts its rows in one reconciliation, so a 200 msg/s raid committing
 * ~20 rows at once is one very heavy frame that caps scroll fps (issue #594).
 * Capping the rows per flush keeps the frame cheap; the overflow stays buffered
 * for the next flush 100ms later rather than being dropped. Normal busy chat is
 * ≤2 rows per flush and never reaches the cap.
 *
 * Android takes the smaller budget - the same reconcile costs more there, and
 * the devices running this app sit below the iOS floor. Off the bottom there is
 * no visible frame to protect, so the backlog commits whole.
 */
export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }

  return Platform.OS === 'android' ? 4 : 8;
};
