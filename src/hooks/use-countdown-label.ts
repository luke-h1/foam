import { useEffect, useState } from 'react';

import { formatTimeRemaining } from '@app/utils/date-time/formatTimeRemaining';

function getRemainingMs(endsAt: string | undefined): number | null {
  return endsAt ? Date.parse(endsAt) - Date.now() : null;
}

/**
 * The time left until `endsAt`, as a label that updates each second. Gives
 * `elapsedLabel` once the time is up, and null when there is no `endsAt`.
 */
export function useCountdownLabel(
  endsAt: string | undefined,
  elapsedLabel: string,
): string | null {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(endsAt));
  const [trackedEndsAt, setTrackedEndsAt] = useState(endsAt);

  if (trackedEndsAt !== endsAt) {
    setTrackedEndsAt(endsAt);
    setRemainingMs(getRemainingMs(endsAt));
  }

  const isRunning = remainingMs !== null && remainingMs > 0;

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingMs(getRemainingMs(endsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, isRunning]);

  if (remainingMs === null) {
    return null;
  }

  return remainingMs > 0 ? formatTimeRemaining(remainingMs) : elapsedLabel;
}
