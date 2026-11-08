import { useEffect, useState } from 'react';

import { runWhenIdle } from '@app/utils/runWhenIdle';

/**
 * Turns true after first interactions, so the Remote Config fetch stays off
 * the first frame.
 */
export function useArmedWhenIdle(): boolean {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void runWhenIdle(() => {
      if (!cancelled) {
        setArmed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return armed;
}
