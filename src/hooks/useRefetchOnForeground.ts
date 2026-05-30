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
