import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import type { AppStateTransition } from '@app/utils/app-state/appStateTransitions';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';

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
