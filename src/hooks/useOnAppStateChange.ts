import { useEffect } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';
import type { AppStateTransition } from '@app/utils/appState/appStateTransitions';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';

/**
 * Runs `onTransition` on every app-state change; the latest callback is always invoked and the subscription lives for the component's lifetime.
 */
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
