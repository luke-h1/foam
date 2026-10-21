/**
 * A hold older than this is treated as lost, so a missed touch end cannot
 * freeze chat. It is far longer than the long-press delay.
 */
const MAX_ROW_TOUCH_HOLD_MS = 5000;

const holdStartedAt = new Map<number, number>();
let nextHoldId = 0;

/**
 * Marks a finger resting on a chat row. Live flushes wait while any hold is
 * active: a flush moves the pressed row away from the finger, and can unmount
 * it, which cancels the long press. Returns the release, which is safe to call
 * more than once.
 */
export function beginRowTouchHold(): () => void {
  nextHoldId += 1;
  const holdId = nextHoldId;
  holdStartedAt.set(holdId, Date.now());

  return () => {
    holdStartedAt.delete(holdId);
  };
}

/**
 * Also deletes holds older than `MAX_ROW_TOUCH_HOLD_MS`. This read is where
 * a lost hold expires.
 */
export function isRowTouchHeld(): boolean {
  const now = Date.now();

  holdStartedAt.forEach((startedAt, holdId) => {
    if (now - startedAt > MAX_ROW_TOUCH_HOLD_MS) {
      holdStartedAt.delete(holdId);
    }
  });

  return holdStartedAt.size > 0;
}
