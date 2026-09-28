import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import type { AppStateTransition } from '@app/utils/app-state/app-state-transitions';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/app-state-transitions';

export function useOnAppStateChange(
  onTransition: (transition: AppStateTransition) => void,
): void {
  const onTransitionRef = useSyncRef(onTransition);

  useEffect(() => {
    const unsubscribe = subscribeToAppStateTransitions(transition => {
      onTransitionRef.current(transition);
    });

    return unsubscribe;
  }, [onTransitionRef]);
}
