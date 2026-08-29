import { useCallback, useRef } from 'react';

import { useFocusEffect } from 'expo-router';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { subscribeToAppForeground } from '@app/utils/appState/appStateTransitions';

interface UseRefetchOnForegroundOptions<TRefetched> {
  enabled?: boolean;
  refetch: () => Promise<TRefetched>;
  /**
   * Floor between refetches - the callbacks bypass staleTime (`refetchQueries` is unconditional), so a quick tab hop would fire a guaranteed request. Defaults to the app-wide 30s staleTime.
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

      refetchIfDue();

      return subscribeToAppForeground(refetchIfDue);
    }, [enabled, refetchIfDue]),
  );
}
