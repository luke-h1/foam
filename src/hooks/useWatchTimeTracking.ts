import {
  maybeRequestStoreReview,
  recordWatchTime,
} from '@app/lib/expo-store-review';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

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

    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        segmentStartRef.current ??= Date.now();
      } else {
        flushSegment();
      }
    });

    return () => {
      subscription.remove();
      flushSegment();
      void maybeRequestStoreReview();
    };
  }, []);
}
