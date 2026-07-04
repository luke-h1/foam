import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';

import { logger } from '@app/utils/logger';

export interface AppStateTransition {
  previous: AppStateStatus;
  current: AppStateStatus;
}

type AppStateTransitionListener = (transition: AppStateTransition) => void;

const listeners = new Set<AppStateTransitionListener>();

let appStateSubscription: NativeEventSubscription | null = null;
let trackedState: AppStateStatus = 'active';

function handleAppStateChange(nextState: AppStateStatus): void {
  const transition: AppStateTransition = {
    previous: trackedState,
    current: nextState,
  };
  trackedState = nextState;
  for (const listener of [...listeners]) {
    try {
      void Promise.resolve(listener(transition)).catch(error =>
        logger.main.warn(
          'AppState transition listener returned a rejected promise',
          {
            action: 'app_state_transition_listener_rejected',
            error,
          },
        ),
      );
    } catch (error) {
      logger.main.warn('AppState transition listener threw', {
        action: 'app_state_transition_listener_error',
        error,
      });
    }
  }
}

/**
 * True when the app returns to `active` from `background` or `inactive`.
 * On iOS, `inactive` also fires for transient interruptions (app switcher,
 * notification shade, Face ID) that never reach `background`, so an
 * `inactive` to `active` transition still counts as coming to the foreground.
 */
export function isForegroundTransition(
  transition: AppStateTransition,
): boolean {
  return (
    transition.current === 'active' &&
    (transition.previous === 'background' || transition.previous === 'inactive')
  );
}

/**
 * Subscribes to app-state changes, delivering both the previous and the
 * current state. All subscribers share a single `AppState` listener; it is
 * attached on the first subscribe and removed when the last subscriber
 * unsubscribes.
 */
export function subscribeToAppStateTransitions(
  listener: AppStateTransitionListener,
): () => void {
  if (!appStateSubscription) {
    trackedState = AppState.currentState;
    appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
  }

  const entry: AppStateTransitionListener = transition => {
    listener(transition);
  };
  listeners.add(entry);

  return () => {
    listeners.delete(entry);
    if (listeners.size === 0 && appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
  };
}

/**
 * Subscribes to came-to-foreground events only (see
 * {@link isForegroundTransition}).
 */
export function subscribeToAppForeground(listener: () => void): () => void {
  return subscribeToAppStateTransitions(transition => {
    if (isForegroundTransition(transition)) {
      listener();
    }
  });
}
