const MAX_ROW_TOUCH_HOLD_MS = 5000;

const holdStartedAt = new Map<number, number>();
let nextHoldId = 0;

/**
 * Marks a finger resting on a chat row. Live flushes wait while any hold is
 * active. Returns the release, which is safe to call more than once.
 */
export function beginRowTouchHold(): () => void {
  nextHoldId += 1;
  const holdId = nextHoldId;
  holdStartedAt.set(holdId, Date.now());

  return () => {
    holdStartedAt.delete(holdId);
  };
}

export function isRowTouchHeld(): boolean {
  const now = Date.now();

  holdStartedAt.forEach((startedAt, holdId) => {
    if (now - startedAt > MAX_ROW_TOUCH_HOLD_MS) {
      holdStartedAt.delete(holdId);
    }
  });

  return holdStartedAt.size > 0;
}
