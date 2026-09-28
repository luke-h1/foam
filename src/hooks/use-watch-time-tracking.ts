import { useEffect, useRef } from 'react';

import {
  maybeRequestStoreReview,
  recordWatchTime,
} from '@app/lib/expo-store-review';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/app-state-transitions';

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
      if (current !== 'active') {
        flushSegment();
        return;
      }

      segmentStartRef.current = segmentStartRef.current ?? Date.now();
    });

    return () => {
      unsubscribe();
      flushSegment();
      void maybeRequestStoreReview();
    };
  }, []);
}
