/* eslint-disable react-doctor/no-event-handler -- store wiring, not event handlers */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import type { ImageRef } from 'expo-image';

import {
  EMOTE_DECODE_MAX_PX,
  ensureCachedEmoteRef,
  getCachedEmoteAspectRatio,
  getCachedEmoteRef,
  subscribeCachedEmoteRef,
  touchCachedEmoteRef,
} from './cache-service';

/**
 * Shared, size-capped decoded {@link ImageRef} for `url`, or `null` until
 * decoded; consumers render `source={ref ?? { uri }}`.
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
  /**
   * Decode on first use; once decoded, mark recently-used so eviction keeps
   * hot emotes.
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

/**
 * Intrinsic aspect ratio of the decoded emote, `null` until it decodes; pass
 * `null` when dimensions are already known so the hook stays inert.
 */
export function useCachedEmoteAspectRatio(url: string | null): number | null {
  const subscribe = useCallback(
    (cb: () => void) => (url ? subscribeCachedEmoteRef(url, cb) : () => {}),
    [url],
  );
  return useSyncExternalStore(
    subscribe,
    () => (url ? getCachedEmoteAspectRatio(url) : null),
    () => null,
  );
}
