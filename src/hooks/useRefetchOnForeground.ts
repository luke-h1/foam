import { useCallback, useRef } from 'react';

import { useFocusEffect } from 'expo-router';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { subscribeToAppForeground } from '@app/utils/appState/appStateTransitions';

interface UseRefetchOnForegroundOptions<TRefetched> {
  enabled?: boolean;
  refetch: () => Promise<TRefetched>;
  /**
   * Minimum time between triggered refetches. The refetch callbacks passed in
   * bypass query staleTime (`refetchQueries` refetches unconditionally), so
   * without a floor a quick tab hop away and back fires a guaranteed network
   * request each time. Defaults to the app-wide 30s query staleTime.
   */
  minIntervalMs?: number;
}

export function useRefetchOnForeground<TRefetched>({
  enabled = true,
  refetch,
  minIntervalMs = 30_000,
}: UseRefetchOnForegroundOptions<TRefetched>) {
  const refetchRef = useSyncRef(refetch);

  const lastRefetchAtRef = useRef(0);

  const refetchIfDue = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchAtRef.current < minIntervalMs) {
      return;
    }
    lastRefetchAtRef.current = now;
    void refetchRef.current();
  }, [minIntervalMs, refetchRef]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      // If the screen regains focus while the app is active (e.g. returning
      // from background while still on this tab, or switching back to this
      // tab after a long pause) ensure data is refreshed.
      refetchIfDue();

      return subscribeToAppForeground(refetchIfDue);
    }, [enabled, refetchIfDue]),
  );
}
