import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

export function useUnmountCallback(callback: () => void) {
  const callbackRef = useSyncRef(callback);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reading the latest callback on unmount is the whole point of this hook
      callbackRef.current();
    };
  }, [callbackRef]);
}
