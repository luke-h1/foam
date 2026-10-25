import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type {
  SkAnimatedImage,
  SkData,
  SkImage,
} from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

import { chatScrollActivity } from '@app/components/chat/util/chat-scroll-activity';
import type { LogMetadataValue } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

interface SharedPaintAnimationEntry {
  animation: SkAnimatedImage | null;
  encoded: SkData | null;
  frameImage: SkImage | null;
  retiredFrames: SkImage[];
  lastAdvanceMs: number;
  refCount: number;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  orphanTimer: ReturnType<typeof setTimeout> | null;
  loadStarted: boolean;
  ready: boolean;
  readyListeners: Set<() => void>;
  frameListeners: Set<() => void>;
}

const entries = new Map<string, SharedPaintAnimationEntry>();
const frameConsumerCounts = new Map<string, number>();
let driverUrls: readonly string[] = [];
const driverListeners = new Set<() => void>();
const frameRevisionListeners = new Set<() => void>();
let frameRevision = 0;
const MAX_SHARED_PAINT_ANIMATION_ENTRIES = 32;

// Keep a released texture briefly so recycled rows rejoin the running clock in phase.
const RELEASED_ENTRY_LINGER_MS = 5000;

const DEFAULT_FRAME_DURATION_MS = 60;

// SkAnimatedImage::decodeNextFrame returns this once the file has played out.
const FINISHED_FRAME = -1;

function notifyReady(entry: SharedPaintAnimationEntry): void {
  entry.readyListeners.forEach(listener => listener());
}

function notifyFrames(entry: SharedPaintAnimationEntry): void {
  frameRevision += 1;
  entry.frameListeners.forEach(listener => listener());
  frameRevisionListeners.forEach(listener => listener());
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

  entry.frameImage?.dispose();
  entry.frameImage = null;

  for (const retired of entry.retiredFrames) {
    retired.dispose();
  }

  entry.retiredFrames = [];
  entry.animation?.dispose();
  entry.animation = null;
  entry.encoded?.dispose();
  entry.encoded = null;
  entry.ready = false;
  notifyReady(entry);
  notifyFrames(entry);
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

function publishPaintFrame(
  entry: SharedPaintAnimationEntry,
  frame: SkImage | null,
  now: number,
): void {
  if (!frame) {
    return;
  }

  if (entry.frameImage) {
    entry.retiredFrames.push(entry.frameImage);
  }

  entry.frameImage = frame;
  entry.lastAdvanceMs = now;

  // The canvas records the previous frame on the next commit. Keep it until
  // the one after that, then drop the JS wrapper.
  const stale =
    entry.retiredFrames.length > 1 ? entry.retiredFrames.shift() : undefined;

  stale?.dispose();
  notifyFrames(entry);
}

function storeStillFrame(
  url: string,
  entry: SharedPaintAnimationEntry,
  frame: SkImage | null,
): void {
  if (!frame) {
    return;
  }

  if (entries.get(url) !== entry) {
    frame.dispose();
    return;
  }

  entry.frameImage = frame;
  entry.ready = true;
  notifyFrames(entry);
  notifyReady(entry);
}

function beginLoad(url: string, entry: SharedPaintAnimationEntry): void {
  if (entry.loadStarted) {
    return;
  }

  entry.loadStarted = true;

  Skia.Data.fromURI(url)
    .then(data => {
      if (entries.get(url) !== entry) {
        return;
      }

      const animated = Skia.AnimatedImage.MakeAnimatedImageFromEncoded(data);

      if (animated && animated.getFrameCount() > 1) {
        entry.animation = animated;
        entry.encoded = data;
        entry.ready = true;
        publishPaintFrame(entry, animated.getCurrentFrame(), Date.now());
        notifyReady(entry);
        return;
      }

      const stillFrame = animated ? animated.getCurrentFrame() : null;

      animated?.dispose();
      storeStillFrame(url, entry, stillFrame);

      if (stillFrame) {
        return;
      }

      // A still WebP or PNG is not an animated image. Keep the decoded frame
      // so an image paint still draws.
      storeStillFrame(url, entry, Skia.Image.MakeImageFromEncoded(data));
    })
    .catch((error: LogMetadataValue) => {
      logger.chat.warn('Failed to load animated paint texture:', {
        error,
        url,
      });
    });
}

function restartPaintAnimation(
  entry: SharedPaintAnimationEntry,
  now: number,
): void {
  const data = entry.encoded;

  if (!data) {
    return;
  }

  const next = Skia.AnimatedImage.MakeAnimatedImageFromEncoded(data);

  if (!next) {
    return;
  }

  entry.animation?.dispose();
  entry.animation = next;
  publishPaintFrame(entry, next.getCurrentFrame(), now);
}

function advancePaintFrame(url: string, now: number): void {
  const entry = entries.get(url);
  const animated = entry?.animation ?? null;

  if (!entry || !animated) {
    return;
  }

  const duration = animated.currentFrameDuration() || DEFAULT_FRAME_DURATION_MS;

  if (entry.lastAdvanceMs !== -1 && now - entry.lastAdvanceMs < duration) {
    return;
  }

  // Decode on the JS thread. SkAnimatedImage is not thread-safe, and the
  // canvas only records images created here. A UI-thread frame never shows.
  const status = animated.decodeNextFrame();

  if (status === FINISHED_FRAME) {
    restartPaintAnimation(entry, now);
    return;
  }

  publishPaintFrame(entry, animated.getCurrentFrame(), now);
}

function advanceSharedPaintFrames(now: number): void {
  const appState = AppState.currentState;

  if (
    chatScrollActivity.isActive() ||
    appState === 'background' ||
    appState === 'inactive'
  ) {
    return;
  }

  for (const url of frameConsumerCounts.keys()) {
    advancePaintFrame(url, now);
  }
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
    animation: null,
    encoded: null,
    frameImage: null,
    retiredFrames: [],
    lastAdvanceMs: -1,
    refCount: 0,
    disposeTimer: null,
    orphanTimer: null,
    loadStarted: false,
    ready: false,
    readyListeners: new Set(),
    frameListeners: new Set(),
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

/**
 * One JS-thread clock for every visible animated paint. Rows share a URL, so
 * they share a frame.
 */
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

  useEffect(() => {
    if (urls.length === 0) {
      return;
    }

    let handle = 0;

    const loop = () => {
      advanceSharedPaintFrames(Date.now());
      handle = requestAnimationFrame(loop);
    };

    handle = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(handle);
    };
  }, [urls]);

  return null;
}

function retainPaintFrames(urls: readonly string[]): () => void {
  for (const url of urls) {
    retainEntry(url);
    addFrameConsumer(url);
  }

  return () => {
    for (const url of urls) {
      removeFrameConsumer(url);
      releaseEntry(url);
    }
  };
}

/**
 * Current frames for several paint textures. One decode per URL, shared by
 * every row that uses it. Call this outside `<Canvas>` so the picture records
 * the new frame. The compiler is off so a cached render cannot keep frame 0.
 */
export function useSharedPaintFrames(
  urls: readonly string[],
): ReadonlyMap<string, SkImage> {
  'use no memo';

  const urlKey = urls.join('\n');

  useEffect(
    () => retainPaintFrames(urlKey === '' ? [] : urlKey.split('\n')),
    [urlKey],
  );

  const revision = useSyncExternalStore(
    listener => {
      frameRevisionListeners.add(listener);
      return () => {
        frameRevisionListeners.delete(listener);
      };
    },
    () => frameRevision,
    () => frameRevision,
  );

  const frames = new Map<string, SkImage>();

  for (const url of urls) {
    const frame = entries.get(url)?.frameImage ?? null;

    if (frame) {
      frames.set(url, frame);
    }
  }

  // `revision` changes when a frame advances, which rebuilds this map.
  void revision;

  return frames;
}

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
