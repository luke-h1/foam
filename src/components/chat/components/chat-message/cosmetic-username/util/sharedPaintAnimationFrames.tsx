import { useEffect, useMemo, useSyncExternalStore } from 'react';

import type { SkImage } from '@shopify/react-native-skia';

import {
  addFrameConsumer,
  getOrCreateEntry,
  releaseEntry,
  removeFrameConsumer,
  retainEntry,
} from './sharedPaintAnimationStore';

/**
 * Current frame for a paint texture, shared per URL so every row shows the
 * same frame. One decode per display frame, not per row.
 */
export function useSharedPaintAnimationFrame(url: string): SkImage | null {
  const entry = useMemo(() => (url ? getOrCreateEntry(url) : null), [url]);

  useEffect(() => {
    if (!url) {
      return;
    }

    retainEntry(url);
    addFrameConsumer(url);

    return () => {
      removeFrameConsumer(url);
      releaseEntry(url);
    };
  }, [url]);

  return useSyncExternalStore(
    listener => {
      if (!entry) {
        return () => {};
      }

      entry.frameListeners.add(listener);

      return () => {
        entry.frameListeners.delete(listener);
      };
    },
    () => (entry ? entry.frameImage : null),
    () => null,
  );
}

export function useSharedPaintAnimationReady(url: string): boolean {
  const entry = useMemo(() => (url ? getOrCreateEntry(url) : null), [url]);

  useEffect(() => {
    if (!url) {
      return;
    }

    retainEntry(url);
    return () => releaseEntry(url);
  }, [url]);

  return useSyncExternalStore(
    listener => {
      if (!entry) {
        return () => {};
      }

      entry.readyListeners.add(listener);

      return () => {
        entry.readyListeners.delete(listener);
      };
    },
    () => (entry ? entry.ready : true),
    () => (entry ? false : true),
  );
}
