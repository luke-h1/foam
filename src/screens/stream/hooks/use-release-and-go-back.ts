import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { router } from 'expo-router';

import type { StreamPlayerRef } from '@app/components/stream-player/types';

/**
 * `releaseMedia` only posts a message to the WebView and returns nothing to
 * wait on. The pause gives the page time to drop the video before the pop.
 */
const RELEASE_BEFORE_BACK_MS = 120;

/**
 * Releases the WebView video before it pops the screen, so an active AVPlayer
 * cannot wedge the transition.
 */
export function useReleaseAndGoBack(
  streamPlayerRef: RefObject<Pick<StreamPlayerRef, 'releaseMedia'> | null>,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(() => {
    streamPlayerRef.current?.releaseMedia();
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;

      if (router.canGoBack()) {
        router.back();
      }
    }, RELEASE_BEFORE_BACK_MS);
  }, [streamPlayerRef]);
}
