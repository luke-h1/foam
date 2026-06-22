/* eslint-disable react-doctor/no-event-handler -- useSyncExternalStore's
   subscribe + the lazy-decode effect are store wiring, not faked event handlers */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import type { ImageRef } from 'expo-image';

import {
  EMOTE_DECODE_MAX_PX,
  ensureCachedEmoteRef,
  getCachedEmoteRef,
  subscribeCachedEmoteRef,
  touchCachedEmoteRef,
} from './cache-service';

/**
 * Returns a shared, size-capped decoded {@link ImageRef} for `url`, or `null`
 * until it has decoded. Kicks off the decode on first use and re-renders the
 * caller once it lands. Consumers render `source={ref ?? { uri }}` so the first
 * occurrence still shows (expo-image memory+disk caches the url too).
 */
export function useCachedEmote(
  url: string,
  maxPx: number = EMOTE_DECODE_MAX_PX,
): ImageRef | null {
  const subscribe = useCallback(
    (cb: () => void) => subscribeCachedEmoteRef(url, cb),
    [url],
  );
  const ref = useSyncExternalStore(
    subscribe,
    () => getCachedEmoteRef(url),
    () => null,
  );
  // Lazily decode on first use (the ref subscription above re-renders when
  // ready); once decoded, mark it recently-used so eviction keeps hot emotes.

  /**
   * Lazily decode on first use (the ref subscription above re-renders when
   * ready); once decoded, mark it recently-used so eviction keeps hot emotes.
   */
  useEffect(() => {
    if (ref) {
      touchCachedEmoteRef(url);
    } else if (url) {
      ensureCachedEmoteRef(url, maxPx);
    }
  }, [url, maxPx, ref]);
  return ref;
}
