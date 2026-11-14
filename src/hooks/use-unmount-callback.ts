import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';

export function useUnmountCallback(callback: () => void) {
  const callbackRef = useSyncRef(callback);

  useEffect(() => {
    const latest = callbackRef;
    return () => {
      latest.current();
    };
  }, [callbackRef]);
}
