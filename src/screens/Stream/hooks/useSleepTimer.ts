import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseSleepTimerOptions {
  /**
   * Called once when the timer elapses. Read via a ref so a stale closure can
   * never fire against an unmounted screen.
   */
  onExpire: () => void;
}

export interface SleepTimer {
  cancel: () => void;
  /**
   * Whole minutes left, rounded up so a menu never shows "0 min" while active.
   */
  getRemainingMinutes: () => number;
  isActive: boolean;
  start: (minutes: number) => void;
}

export function useSleepTimer({ onExpire }: UseSleepTimerOptions): SleepTimer {
  const [deadline, setDeadline] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPending, [clearPending]);

  const cancel = useCallback(() => {
    clearPending();
    setDeadline(null);
  }, [clearPending]);

  const start = useCallback(
    (minutes: number) => {
      clearPending();
      setDeadline(Date.now() + minutes * 60_000);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setDeadline(null);
        onExpireRef.current();
      }, minutes * 60_000);
    },
    [clearPending],
  );

  const getRemainingMinutes = useCallback(() => {
    if (deadline === null) {
      return 0;
    }
    return Math.max(1, Math.ceil((deadline - Date.now()) / 60_000));
  }, [deadline]);

  // Stable identity so consumers can hold callbacks that only change when the
  // timer state actually changes, not on every render of the owning screen.
  return useMemo(
    () => ({ cancel, getRemainingMinutes, isActive: deadline !== null, start }),
    [cancel, deadline, getRemainingMinutes, start],
  );
}
