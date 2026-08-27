import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  makeMutable,
  type SharedValue,
  useFrameCallback,
} from 'react-native-reanimated';

import type { SkAnimatedImage, SkImage } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

import { chatScrollActiveShared } from '@app/components/Chat/util/chatScrollActiveShared';
import type { LogMetadataValue } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

interface SharedPaintAnimationEntry {
  animatedImage: SharedValue<SkAnimatedImage | null>;
  frame: SharedValue<SkImage | null>;
  lastTimestamp: SharedValue<number>;
  refCount: number;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  ready: boolean;
  readyListeners: Set<() => void>;
}

const entries = new Map<string, SharedPaintAnimationEntry>();

// Keep a released texture briefly so recycled rows rejoin the running clock in phase.
const RELEASED_ENTRY_LINGER_MS = 5_000;

const DEFAULT_FRAME_DURATION_MS = 60;

function notifyReady(entry: SharedPaintAnimationEntry): void {
  entry.readyListeners.forEach(listener => listener());
}

function disposeEntry(url: string, entry: SharedPaintAnimationEntry): void {
  if (entries.get(url) === entry) {
    entries.delete(url);
  }
  entry.frame.value?.dispose();
  entry.frame.value = null;
  entry.animatedImage.value?.dispose();
  entry.animatedImage.value = null;
  entry.ready = false;
  notifyReady(entry);
}

function getOrCreateEntry(url: string): SharedPaintAnimationEntry {
  const existing = entries.get(url);
  if (existing) {
    if (existing.disposeTimer) {
      clearTimeout(existing.disposeTimer);
      existing.disposeTimer = null;
    }
    return existing;
  }

  const entry: SharedPaintAnimationEntry = {
    animatedImage: makeMutable<SkAnimatedImage | null>(null),
    frame: makeMutable<SkImage | null>(null),
    lastTimestamp: makeMutable(-1),
    refCount: 0,
    disposeTimer: null,
    ready: false,
    readyListeners: new Set(),
  };
  entries.set(url, entry);

  Skia.Data.fromURI(url)
    .then(data => {
      const image = Skia.AnimatedImage.MakeAnimatedImageFromEncoded(data);
      if (entries.get(url) !== entry) {
        image?.dispose();
        return;
      }
      if (!image) {
        return;
      }
      entry.animatedImage.value = image;
      image.decodeNextFrame();
      entry.frame.value = image.getCurrentFrame();
      entry.ready = true;
      notifyReady(entry);
    })
    .catch((error: LogMetadataValue) => {
      logger.chat.warn('Failed to load animated paint texture:', {
        error,
        url,
      });
    });

  return entry;
}

function retainEntry(url: string): void {
  const entry = getOrCreateEntry(url);
  entry.refCount += 1;
}

function releaseEntry(url: string): void {
  const entry = entries.get(url);
  if (!entry) {
    return;
  }
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0 || entry.disposeTimer) {
    return;
  }
  entry.disposeTimer = setTimeout(
    () => disposeEntry(url, entry),
    RELEASED_ENTRY_LINGER_MS,
  );
}

/**
 * Frame stream for an animated paint texture, shared per URL so every row
 * shows the same frame - one decode per display frame, not per row.
 */
export function useSharedPaintAnimationFrame(
  url: string,
): SharedValue<SkImage | null> {
  const entry = useMemo(() => getOrCreateEntry(url), [url]);

  useEffect(() => {
    retainEntry(url);
    return () => releaseEntry(url);
  }, [url]);

  const { animatedImage, frame, lastTimestamp } = entry;
  useFrameCallback(frameInfo => {
    const image = animatedImage.value;
    if (image == null) {
      return;
    }
    if (chatScrollActiveShared.value) {
      return;
    }
    const duration = image.currentFrameDuration() || DEFAULT_FRAME_DURATION_MS;
    if (
      lastTimestamp.value !== -1 &&
      frameInfo.timestamp - lastTimestamp.value < duration
    ) {
      return;
    }
    image.decodeNextFrame();
    const oldFrame = frame.value;
    frame.value = image.getCurrentFrame();
    oldFrame?.dispose();
    lastTimestamp.value = frameInfo.timestamp;
  });

  return frame;
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
