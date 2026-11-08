import { useEffect, useState } from 'react';

import { runWhenIdle } from '@app/utils/runWhenIdle';

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
