import { AppState } from 'react-native';

import type {
  SkAnimatedImage,
  SkData,
  SkImage,
} from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

import { chatScrollActivity } from '@app/components/chat/util/chatScrollActivity';
import type { LogMetadataValue } from '@app/utils/log/sanitiseLogValue';
import { logger } from '@app/utils/logger';

export interface SharedPaintAnimationEntry {
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
const MAX_SHARED_PAINT_ANIMATION_ENTRIES = 32;

const RELEASED_ENTRY_LINGER_MS = 5000;

const DEFAULT_FRAME_DURATION_MS = 60;

const loggedLoadFailureUrls = new Set<string>();
const MAX_LOGGED_LOAD_FAILURE_URLS = 256;

const FINISHED_FRAME = -1;

function callListener(listener: () => void): void {
  listener();
}

function notifyReady(entry: SharedPaintAnimationEntry): void {
  entry.readyListeners.forEach(callListener);
}

function notifyFrames(entry: SharedPaintAnimationEntry): void {
  entry.frameListeners.forEach(callListener);
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

      storeStillFrame(url, entry, Skia.Image.MakeImageFromEncoded(data));
    })
    .catch((error: LogMetadataValue) => {
      if (loggedLoadFailureUrls.has(url)) {
        return;
      }

      if (loggedLoadFailureUrls.size >= MAX_LOGGED_LOAD_FAILURE_URLS) {
        loggedLoadFailureUrls.clear();
      }

      loggedLoadFailureUrls.add(url);
      logger.chat.debug('Failed to load animated paint texture:', {
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

  const status = animated.decodeNextFrame();

  if (status === FINISHED_FRAME) {
    restartPaintAnimation(entry, now);
    return;
  }

  publishPaintFrame(entry, animated.getCurrentFrame(), now);
}

export function advanceSharedPaintFrames(now: number): void {
  const appState = AppState.currentState;

  if (
    chatScrollActivity.isActive() ||
    appState === 'background' ||
    appState === 'inactive'
  ) {
    return;
  }

  const urls = driverUrls;

  for (let index = 0; index < urls.length; index += 1) {
    advancePaintFrame(urls[index]!, now);
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

export function getOrCreateEntry(url: string): SharedPaintAnimationEntry {
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

export function retainEntry(url: string): void {
  const entry = getOrCreateEntry(url);

  clearEntryTimers(entry);

  entry.refCount += 1;
  beginLoad(url, entry);
  evictLingeringEntries();
}

export function releaseEntry(url: string): void {
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

export function addFrameConsumer(url: string): void {
  frameConsumerCounts.set(url, (frameConsumerCounts.get(url) ?? 0) + 1);
  syncDriverUrls();
}

export function removeFrameConsumer(url: string): void {
  const remaining = (frameConsumerCounts.get(url) ?? 0) - 1;

  if (remaining <= 0) {
    frameConsumerCounts.delete(url);
  } else {
    frameConsumerCounts.set(url, remaining);
  }

  syncDriverUrls();
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

export function getSharedPaintFrame(url: string): SkImage | null {
  return entries.get(url)?.frameImage ?? null;
}

export function subscribeSharedPaintFrames(
  urls: readonly string[],
  onFrame: () => void,
): () => void {
  const release = retainPaintFrames(urls);

  for (const url of urls) {
    entries.get(url)?.frameListeners.add(onFrame);
  }

  return () => {
    for (const url of urls) {
      entries.get(url)?.frameListeners.delete(onFrame);
    }

    release();
  };
}

export function subscribeDriverUrls(listener: () => void): () => void {
  driverListeners.add(listener);

  return () => {
    driverListeners.delete(listener);
  };
}

export function getDriverUrls(): readonly string[] {
  return driverUrls;
}
