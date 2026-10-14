import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';

export function useUnmountCallback(callback: () => void) {
  const callbackRef = useSyncRef(callback);

  useEffect(() => {
    // Read `.current` in the cleanup. Capturing it here would freeze the first callback.
    const latest = callbackRef;
    return () => {
      latest.current();
    };
  }, [callbackRef]);
}
