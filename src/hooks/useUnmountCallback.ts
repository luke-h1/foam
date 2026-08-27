import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

export function useUnmountCallback(callback: () => void) {
  const callbackRef = useSyncRef(callback);

  useEffect(() => {
    // Hold the ref object, not its value - capturing `.current` here would freeze the first callback.
    const latest = callbackRef;
    return () => {
      latest.current();
    };
  }, [callbackRef]);
}
