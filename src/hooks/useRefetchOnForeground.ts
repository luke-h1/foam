import { useCallback, useRef } from 'react';

import { useFocusEffect } from 'expo-router';

import { subscribeToAppForeground } from '@app/utils/appState/appStateTransitions';

interface UseRefetchOnForegroundOptions {
  enabled?: boolean;
  refetch: () => Promise<unknown>;
}

export function useRefetchOnForeground({
  enabled = true,
  refetch,
}: UseRefetchOnForegroundOptions) {
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

      return subscribeToAppForeground(() => {
        void refetchRef.current();
      });
    }, [enabled]),
  );
}
