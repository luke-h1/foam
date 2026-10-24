import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  makeMutable,
  type SharedValue,
  useFrameCallback,
} from 'react-native-reanimated';

import type { SkAnimatedImage, SkImage } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

import { chatScrollActiveShared } from '@app/components/chat/util/chat-scroll-active-shared';
import type { LogMetadataValue } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

interface SharedPaintAnimationEntry {
  animatedImage: SharedValue<SkAnimatedImage | null>;
  frame: SharedValue<SkImage | null>;
  lastTimestamp: SharedValue<number>;
  refCount: number;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  orphanTimer: ReturnType<typeof setTimeout> | null;
  loadStarted: boolean;
  ready: boolean;
  readyListeners: Set<() => void>;
}

const entries = new Map<string, SharedPaintAnimationEntry>();
const frameConsumerCounts = new Map<string, number>();
let driverUrls: readonly string[] = [];
const driverListeners = new Set<() => void>();
const MAX_SHARED_PAINT_ANIMATION_ENTRIES = 32;

// Keep a released texture briefly so recycled rows rejoin the running clock in phase.
const RELEASED_ENTRY_LINGER_MS = 5000;

const DEFAULT_FRAME_DURATION_MS = 60;

function notifyReady(entry: SharedPaintAnimationEntry): void {
  entry.readyListeners.forEach(listener => listener());
}

function clearEntryTimers(entry: SharedPaintAnimationEntry): void {
  if (entry.disposeTimer) {
    clearTimeout(entry.disposeTimer);
    entry.disposeTimer = null;
  }

  if (entry.orphanTimer) {
    clearTimeout(entry.orphanTimer);
    entry.orphanTimer = null;
  }
}

function disposeEntry(url: string, entry: SharedPaintAnimationEntry): void {
  clearEntryTimers(entry);

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

function evictLingeringEntries(): void {
  while (entries.size > MAX_SHARED_PAINT_ANIMATION_ENTRIES) {
    let victimUrl: string | undefined;
    let victim: SharedPaintAnimationEntry | undefined;

    for (const [url, entry] of entries) {
      if (entry.refCount === 0 && entry.disposeTimer) {
        victimUrl = url;
        victim = entry;
        break;
      }
    }

    if (!victimUrl || !victim) {
      return;
    }

    disposeEntry(victimUrl, victim);
  }
}

let memoryWarningSubscribed = false;

function subscribeToMemoryWarnings(): void {
  if (memoryWarningSubscribed) {
    return;
  }

  memoryWarningSubscribed = true;

  AppState.addEventListener('memoryWarning', () => {
    for (const [url, entry] of [...entries]) {
      if (entry.refCount === 0 && entry.orphanTimer === null) {
        disposeEntry(url, entry);
      }
    }
  });
}

function beginLoad(url: string, entry: SharedPaintAnimationEntry): void {
  if (entry.loadStarted) {
    return;
  }

  entry.loadStarted = true;

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
}

function armOrphanTimer(url: string, entry: SharedPaintAnimationEntry): void {
  entry.orphanTimer = setTimeout(() => {
    entry.orphanTimer = null;

    if (entries.get(url) !== entry || entry.refCount > 0) {
      return;
    }

    disposeEntry(url, entry);
  }, RELEASED_ENTRY_LINGER_MS);
}

function claimExistingEntry(
  url: string,
  existing: SharedPaintAnimationEntry,
): SharedPaintAnimationEntry {
  entries.delete(url);
  entries.set(url, existing);

  if (existing.refCount > 0) {
    return existing;
  }

  clearEntryTimers(existing);
  armOrphanTimer(url, existing);
  return existing;
}

function getOrCreateEntry(url: string): SharedPaintAnimationEntry {
  subscribeToMemoryWarnings();

  const existing = entries.get(url);

  if (existing) {
    return claimExistingEntry(url, existing);
  }

  const entry: SharedPaintAnimationEntry = {
    animatedImage: makeMutable<SkAnimatedImage | null>(null),
    frame: makeMutable<SkImage | null>(null),
    lastTimestamp: makeMutable(-1),
    refCount: 0,
    disposeTimer: null,
    orphanTimer: null,
    loadStarted: false,
    ready: false,
    readyListeners: new Set(),
  };

  entries.set(url, entry);
  armOrphanTimer(url, entry);

  return entry;
}

function retainEntry(url: string): void {
  const entry = getOrCreateEntry(url);

  clearEntryTimers(entry);

  entry.refCount += 1;
  beginLoad(url, entry);
  evictLingeringEntries();
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

function syncDriverUrls(): void {
  const next: string[] = [];

  for (const url of frameConsumerCounts.keys()) {
    next.push(url);
  }

  const unchanged =
    next.length === driverUrls.length &&
    next.every((url, index) => url === driverUrls[index]);

  if (unchanged) {
    return;
  }

  driverUrls = next;
  driverListeners.forEach(listener => listener());
}

function addFrameConsumer(url: string): void {
  frameConsumerCounts.set(url, (frameConsumerCounts.get(url) ?? 0) + 1);
  syncDriverUrls();
}

function removeFrameConsumer(url: string): void {
  const remaining = (frameConsumerCounts.get(url) ?? 0) - 1;

  if (remaining <= 0) {
    frameConsumerCounts.delete(url);
  } else {
    frameConsumerCounts.set(url, remaining);
  }

  syncDriverUrls();
}

function PaintUrlFrameDriver({
  animatedImage,
  frame,
  lastTimestamp,
}: {
  animatedImage: SharedValue<SkAnimatedImage | null>;
  frame: SharedValue<SkImage | null>;
  lastTimestamp: SharedValue<number>;
}) {
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

  return null;
}

function PaintUrlFrameDriverGate({ url }: { url: string }) {
  const entry = entries.get(url);

  if (!entry) {
    return null;
  }

  return (
    <PaintUrlFrameDriver
      animatedImage={entry.animatedImage}
      frame={entry.frame}
      lastTimestamp={entry.lastTimestamp}
    />
  );
}

export function SharedPaintAnimationDrivers() {
  const urls = useSyncExternalStore(
    listener => {
      driverListeners.add(listener);
      return () => {
        driverListeners.delete(listener);
      };
    },
    () => driverUrls,
    () => driverUrls,
  );

  return urls.map(url => <PaintUrlFrameDriverGate key={url} url={url} />);
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
    addFrameConsumer(url);

    return () => {
      removeFrameConsumer(url);
      releaseEntry(url);
    };
  }, [url]);

  return entry.frame;
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
