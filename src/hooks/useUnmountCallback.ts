import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

export function useUnmountCallback(callback: () => void) {
  const callbackRef = useSyncRef(callback);

  useEffect(() => {
    // Hold the ref object, not its value: the callback is meant to be read at
    // unmount, so capturing `.current` here would freeze the first one.
    const latest = callbackRef;
    return () => {
      latest.current();
    };
  }, [callbackRef]);
}
