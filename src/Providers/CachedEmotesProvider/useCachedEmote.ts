/* eslint-disable react-doctor/no-event-handler -- useSyncExternalStore's
   subscribe + the lazy-decode effect are store wiring, not faked event handlers */
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

/**
 * Subscribes to the intrinsic aspect ratio (width / height) of the decoded emote
 * for `url`, returning `null` until it decodes. Only pass a url for emotes whose
 * provider doesn't advertise dimensions (Twitch, BTTV, and 7TV encodes that
 * arrive without size metadata); pass `null` when reliable dimensions are
 * already known so the hook stays inert. This piggybacks on the decode kicked
 * off by {@link useCachedEmote}, so it never triggers a decode of its own.
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
