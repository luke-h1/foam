import { useEffect, useRef } from 'react';

import type { AppStateTransition } from '@app/utils/appState/appStateTransitions';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';

/**
 * Runs `onTransition` on every app-state change with the previous and
 * current state. The latest callback is always invoked; the underlying
 * subscription lives for the component's lifetime.
 */
export function useOnAppStateChange(
  onTransition: (transition: AppStateTransition) => void,
): void {
  const onTransitionRef = useRef(onTransition);
  onTransitionRef.current = onTransition;

  useEffect(
    () =>
      subscribeToAppStateTransitions(transition => {
        onTransitionRef.current(transition);
      }),
    [],
  );
}
