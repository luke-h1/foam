import { useEffect, useRef } from 'react';

import {
  maybeRequestStoreReview,
  recordWatchTime,
} from '@app/lib/expo-store-review';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';

/**
 * Accumulates foreground stream watch time for the store-review prompt
 * gate. Mount once per stream player instance; the review request is
 * attempted when the player unmounts (i.e. after a watch session, not
 * during one).
 */
export function useWatchTimeTracking(): void {
  const segmentStartRef = useRef<number | null>(null);

  useEffect(() => {
    segmentStartRef.current = Date.now();

    const flushSegment = () => {
      if (segmentStartRef.current !== null) {
        recordWatchTime(Date.now() - segmentStartRef.current);
        segmentStartRef.current = null;
      }
    };

    const unsubscribe = subscribeToAppStateTransitions(({ current }) => {
      if (current === 'active') {
        segmentStartRef.current ??= Date.now();
      } else {
        flushSegment();
      }
    });

    return () => {
      unsubscribe();
      flushSegment();
      void maybeRequestStoreReview();
    };
  }, []);
}
