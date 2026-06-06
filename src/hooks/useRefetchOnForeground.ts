import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface UseRefetchOnForegroundOptions {
  enabled?: boolean;
  refetch: () => Promise<unknown>;
}

export function useRefetchOnForeground({
  enabled = true,
  refetch,
}: UseRefetchOnForegroundOptions) {
  const previousStateRef = useRef<AppStateStatus>(AppState.currentState);
  const refetchRef = useRef(refetch);

  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      // If the screen regains focus while the app is active (e.g. returning
      // from background while still on this tab, or switching back to this
      // tab after a long pause) ensure data is refreshed.
      void refetchRef.current();

      const subscription = AppState.addEventListener('change', nextState => {
        const previousState = previousStateRef.current;
        previousStateRef.current = nextState;

        if (
          nextState === 'active' &&
          (previousState === 'background' || previousState === 'inactive')
        ) {
          void refetchRef.current();
        }
      });

      return () => subscription.remove();
    }, [enabled]),
  );
}
