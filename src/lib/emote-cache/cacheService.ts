import { AppState, type AppStateStatus, Platform } from 'react-native';

import { Image, type ImageRef } from 'expo-image';

import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';
import {
  getDeviceTier,
  getTotalDeviceMemoryBytes,
} from '@app/utils/device/deviceTier';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { logger } from '@app/utils/logger';
import type { ImageMemoryPressureEvent } from '@modules/image-memory-pressure/src/ImageMemoryPressure.types';
import ImageMemoryPressure from '@modules/image-memory-pressure/src/ImageMemoryPressureModule';

const isLowTier = getDeviceTier() === 'low';

export const EMOTE_DECODE_MAX_PX = isLowTier ? 64 : 96;

const MAX_ENTRIES = isLowTier ? 1200 : 2400;

const MAX_DECODED_BYTES = (() => {
  const ceil = isLowTier ? 128 * 1024 * 1024 : 600 * 1024 * 1024;
  const floor = isLowTier ? 96 * 1024 * 1024 : 192 * 1024 * 1024;
  const totalMemoryBytes = getTotalDeviceMemoryBytes();

  if (totalMemoryBytes <= 0) {
    return floor;
  }

  return Math.max(floor, Math.min(ceil, Math.floor(totalMemoryBytes * 0.05)));
})();

const ANIMATED_BYTE_FACTOR = 16;

type CacheEntry = {
  ref: ImageRef;
  bytes: number;
  aspect: number | null;
};

const refs = new Map<string, CacheEntry>();
let totalBytes = 0;
const pinned = new Set<string>();

const inflight = new Map<string, number>();

const listeners = new Map<string, Set<() => void>>();
let cacheEpoch = 0;

const recentlyReleased = new Set<string>();
let releaseRaceCount = 0;

function reportSampledWarning(
  message: string,
  count: number,
  fields: { url: string; activeDecodes?: number; queuedDecodes?: number },
): number {
  const next = count + 1;

  if (next === 1 || next % 50 === 0) {
    logger.chat.warn(message, {
      name: 'chat_resources_warning',
      count: next,
      ...fields,
    });
  }

  return next;
}

function estimateRefBytes(animated: boolean, maxPx: number): number {
  const pixelBytes = maxPx * maxPx * 4;
  return Math.round(animated ? pixelBytes * ANIMATED_BYTE_FACTOR : pixelBytes);
}

const pendingReleases: { url: string; ref: ImageRef; frames: number }[] = [];
let releaseFlushScheduled = false;

const MAX_RELEASE_DEFER_FRAMES = 2;

let recentlyReleasedSweepScheduled = false;

function scheduleRecentlyReleasedSweep(): void {
  if (recentlyReleasedSweepScheduled) {
    return;
  }

  recentlyReleasedSweepScheduled = true;

  requestAnimationFrame(() => {
    const sweep = [...recentlyReleased];

    requestAnimationFrame(() => {
      recentlyReleasedSweepScheduled = false;
      sweep.forEach(url => recentlyReleased.delete(url));

      if (recentlyReleased.size > 0) {
        scheduleRecentlyReleasedSweep();
      }
    });
  });
}

function markRecentlyReleased(url: string): void {
  recentlyReleased.add(url);
  scheduleRecentlyReleasedSweep();
}

function flushPendingReleases(): void {
  releaseFlushScheduled = false;
  const batch = pendingReleases.splice(0, pendingReleases.length);

  for (const pending of batch) {
    if (
      listeners.has(pending.url) &&
      pending.frames < MAX_RELEASE_DEFER_FRAMES
    ) {
      pending.frames += 1;

      pendingReleases.push(pending);
      continue;
    }

    try {
      pending.ref.release();
    } catch {
      // ignore
    }

    markRecentlyReleased(pending.url);
  }

  if (pendingReleases.length > 0 && !releaseFlushScheduled) {
    releaseFlushScheduled = true;
    requestAnimationFrame(flushPendingReleases);
  }
}

function releaseRef(url: string): boolean {
  const entry = refs.get(url);

  if (!entry) {
    return false;
  }

  pendingReleases.push({ url, ref: entry.ref, frames: 0 });

  if (!releaseFlushScheduled) {
    releaseFlushScheduled = true;
    requestAnimationFrame(flushPendingReleases);
  }

  totalBytes -= entry.bytes;
  return refs.delete(url);
}

function withinBudget(incomingBytes: number): boolean {
  return (
    refs.size < MAX_ENTRIES && totalBytes + incomingBytes <= MAX_DECODED_BYTES
  );
}

function evictUnpinnedToFit(incomingBytes: number): void {
  if (withinBudget(incomingBytes)) {
    return;
  }

  for (const url of refs.keys()) {
    if (withinBudget(incomingBytes)) {
      return;
    }

    if (pinned.has(url) || listeners.has(url)) {
      continue;
    }

    releaseRef(url);
  }
}

const MAX_CONCURRENT_DECODES = isLowTier ? 4 : 8;

const DECODE_TIMEOUT_MS = 20_000;

let activeDecodes = 0;
let decodeTimeoutCount = 0;
type DecodeWaiter = { url: string; resolve: () => void };
const decodeWaiters: DecodeWaiter[] = [];
const lowPriorityDecodeWaiters: DecodeWaiter[] = [];

function acquireDecodeSlot(url: string, lowPriority = false): Promise<void> {
  if (activeDecodes < MAX_CONCURRENT_DECODES) {
    activeDecodes += 1;
    return Promise.resolve();
  }

  return new Promise<void>(resolve => {
    (lowPriority ? lowPriorityDecodeWaiters : decodeWaiters).push({
      url,
      resolve,
    });
  });
}

function promoteDecodeWaiter(url: string): void {
  const index = lowPriorityDecodeWaiters.findIndex(
    waiter => waiter.url === url,
  );

  if (index === -1) {
    return;
  }

  decodeWaiters.push(...lowPriorityDecodeWaiters.splice(index, 1));
}

function releaseDecodeSlot(): void {
  const next = decodeWaiters.shift() ?? lowPriorityDecodeWaiters.shift();
  if (next) {
    next.resolve();
  } else {
    activeDecodes -= 1;
  }
}

class EmoteDecodeTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`emote decode timed out after ${timeoutMs}ms`);
    this.name = 'EmoteDecodeTimeoutError';
  }
}

const failedDecodes = new Set<string>();

const MAX_FAILED_DECODES = 500;

function rememberFailedDecode(url: string, error: unknown): void {
  if (failedDecodes.has(url)) {
    return;
  }

  if (failedDecodes.size >= MAX_FAILED_DECODES) {
    failedDecodes.clear();
  }

  failedDecodes.add(url);
  logger.cache.debug('chat.emote.decode_failed', { url, error });
}

function loadWithTimeout(
  url: string,
  maxPx: number,
  requestEpoch: number,
  onLate: (ref: ImageRef) => void,
): Promise<ImageRef> {
  const load = Image.loadAsync(
    { uri: url },
    { maxWidth: maxPx, maxHeight: maxPx },
  );

  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      load.then(onLate).catch(() => {
        // ignore
      });

      if (requestEpoch === cacheEpoch) {
        decodeTimeoutCount = reportSampledWarning(
          'chat.emote.decode_timeout',
          decodeTimeoutCount,
          {
            url,
            activeDecodes,
            queuedDecodes:
              decodeWaiters.length + lowPriorityDecodeWaiters.length,
          },
        );
      }

      reject(new EmoteDecodeTimeoutError(DECODE_TIMEOUT_MS));
    }, DECODE_TIMEOUT_MS);
  });

  return Promise.race([load, timeout]).finally(() => clearTimeout(timer));
}

function notify(url: string): void {
  listeners.get(url)?.forEach(cb => cb());
}

function notifyAll(): void {
  listeners.forEach(set => set.forEach(cb => cb()));
}

export function getCachedEmoteRef(url: string): ImageRef | null {
  return refs.get(url)?.ref ?? null;
}

export function getCachedEmoteAspectRatio(url: string): number | null {
  return refs.get(url)?.aspect ?? null;
}

export function touchCachedEmoteRef(url: string): void {
  const entry = refs.get(url);
  if (entry !== undefined) {
    refs.delete(url);
    refs.set(url, entry);
  }
}

function decodeInto(
  url: string,
  maxPx: number,
  pin: boolean,
  lowPriority = false,
): Promise<void> {
  if (pin && refs.has(url)) {
    pinned.add(url);
  }

  if (url && !lowPriority && inflight.has(url)) {
    promoteDecodeWaiter(url);
  }

  if (!url || refs.has(url) || inflight.has(url) || failedDecodes.has(url)) {
    return Promise.resolve();
  }

  const requestEpoch = cacheEpoch;
  inflight.set(url, requestEpoch);
  return runDecode(url, maxPx, pin, requestEpoch, lowPriority);
}

async function runDecode(
  url: string,
  maxPx: number,
  pin: boolean,
  requestEpoch: number,
  lowPriority: boolean,
): Promise<void> {
  // oxlint-disable-next-line react-doctor/async-defer-await -- slot first, then staleness re-check
  await acquireDecodeSlot(url, lowPriority);

  try {
    if (requestEpoch !== cacheEpoch) {
      return;
    }

    // oxlint-disable-next-line react-doctor/async-defer-await -- epoch fence re-checks after the decode
    const ref = await loadWithTimeout(url, maxPx, requestEpoch, late =>
      commitDecodedRef(url, maxPx, pin, requestEpoch, late, true),
    );

    commitDecodedRef(url, maxPx, pin, requestEpoch, ref, false);
  } catch (error) {
    if (!(error instanceof EmoteDecodeTimeoutError)) {
      rememberFailedDecode(url, error);
    }
  } finally {
    releaseDecodeSlot();
    if (inflight.get(url) === requestEpoch) {
      inflight.delete(url);
    }
  }
}

function commitDecodedRef(
  url: string,
  maxPx: number,
  pin: boolean,
  requestEpoch: number,
  ref: ImageRef,
  late: boolean,
): void {
  const superseded = late
    ? inflight.has(url) || refs.has(url)
    : inflight.get(url) !== requestEpoch;

  if (superseded || requestEpoch !== cacheEpoch) {
    try {
      ref.release();
    } catch {
      // ignore
    }

    return;
  }

  const kind = describeEmoteUrl(url).kind;

  const cost = estimateRefBytes(
    kind === null ? ref.isAnimated === true : kind === 'animated',
    maxPx,
  );

  evictUnpinnedToFit(cost);

  refs.set(url, {
    ref,
    bytes: cost,
    aspect: ref.width > 0 && ref.height > 0 ? ref.width / ref.height : null,
  });

  totalBytes += cost;

  if (pin) {
    pinned.add(url);
  }

  notify(url);
}

export function ensureCachedEmoteRef(
  url: string,
  maxPx: number = EMOTE_DECODE_MAX_PX,
): void {
  void decodeInto(url, maxPx, false);
}

export function subscribeCachedEmoteRef(
  url: string,
  cb: () => void,
): () => void {
  if (recentlyReleased.has(url) && !refs.has(url)) {
    releaseRaceCount = reportSampledWarning(
      'chat.emote.ref_release_race',
      releaseRaceCount,
      { url },
    );
  }

  const set = listeners.get(url) ?? new Set<typeof cb>();
  listeners.set(url, set);
  set.add(cb);

  return () => {
    set.delete(cb);
    if (set.size === 0) {
      listeners.delete(url);
    }
  };
}

export async function warmCachedEmoteRefs(
  urls: string[],
  {
    maxPx = EMOTE_DECODE_MAX_PX,
    pin = false,
  }: { maxPx?: number; pin?: boolean } = {},
): Promise<void> {
  await Promise.all(urls.map(url => decodeInto(url, maxPx, pin, true)));
}

export function evictCachedEmoteRef(url: string): void {
  const hadRef = releaseRef(url);
  pinned.delete(url);

  if (hadRef) {
    notify(url);
  }
}

export function releaseChannelEmoteRefs({
  keepSubscribed = false,
}: { keepSubscribed?: boolean } = {}): void {
  for (const url of refs.keys()) {
    if (pinned.has(url)) {
      continue;
    }

    if (keepSubscribed && listeners.has(url)) {
      continue;
    }

    releaseRef(url);
    notify(url);
  }
}

export function abortInflightEmoteDecodes(): void {
  cacheEpoch += 1;
  inflight.clear();
}

export function clearCachedEmoteRefs(): void {
  abortInflightEmoteDecodes();

  for (const url of refs.keys()) {
    releaseRef(url);
  }

  totalBytes = 0;
  pinned.clear();
  recentlyReleased.clear();
  failedDecodes.clear();
  releaseRaceCount = 0;
  decodeTimeoutCount = 0;
  notifyAll();
}

const IMAGE_CACHE_CLEAR_THROTTLE_MS = 30_000;
let lastImageCacheClearAt = 0;

type MemoryPressureTrimOptions = {
  clearImageCache?: boolean;
  keepSubscribed?: boolean;
  throttled?: boolean;
};

function trimForMemoryPressure({
  clearImageCache = true,
  keepSubscribed = false,
  throttled = false,
}: MemoryPressureTrimOptions = {}): void {
  releaseChannelEmoteRefs({ keepSubscribed });

  if (!clearImageCache) {
    return;
  }

  const now = Date.now();

  if (
    throttled &&
    now - lastImageCacheClearAt < IMAGE_CACHE_CLEAR_THROTTLE_MS
  ) {
    return;
  }

  lastImageCacheClearAt = now;
  void Image.clearMemoryCache();
}

type TrimDecodedEmotesReason = 'advisory' | 'reclaim';

export function trimDecodedEmotes(reason: TrimDecodedEmotesReason): void {
  if (reason === 'advisory') {
    trimForMemoryPressure({ keepSubscribed: true, throttled: true });
    return;
  }

  trimForMemoryPressure();
}

let memoryPressureSubscribed = false;

const ANDROID_TRIM_MEMORY_RUNNING_CRITICAL = 15;

const LOW_MEMORY_HEADROOM_BYTES =
  Platform.OS === 'android' ? 100 * 1024 * 1024 : 200 * 1024 * 1024;

const MEMORY_POLL_INTERVAL_MS = 5000;

const MEMORY_PRESSURE_LOG_THROTTLE_MS = 60_000;

let memoryMonitorTimer: ReturnType<typeof setInterval> | null = null;
let lastMemoryPressureLogAt = 0;

function logMemoryPressureTrim(
  cause: { availableBytes: number } | { trimLevel: number },
): void {
  const now = Date.now();

  if (now - lastMemoryPressureLogAt < MEMORY_PRESSURE_LOG_THROTTLE_MS) {
    return;
  }

  lastMemoryPressureLogAt = now;

  logger.chat.warn('chat.emote.memory_pressure_trim', {
    name: 'chat_resources_warning',
    ...cause,
    decodedBytes: totalBytes,
    decodedRefs: refs.size,
    subscribedRefs: listeners.size,
  });
}

function pollMemoryHeadroom(): void {
  let available = 0;

  try {
    available = ImageMemoryPressure.getAvailableMemory();
  } catch {
    return;
  }

  if (available <= 0 || available >= LOW_MEMORY_HEADROOM_BYTES) {
    return;
  }

  logMemoryPressureTrim({ availableBytes: available });
  trimDecodedEmotes('advisory');
}

function handleNativeMemoryPressure(event: ImageMemoryPressureEvent): void {
  logMemoryPressureTrim({ trimLevel: event.level });
  trimForMemoryPressure({
    clearImageCache: event.level >= ANDROID_TRIM_MEMORY_RUNNING_CRITICAL,
    keepSubscribed: true,
    throttled: true,
  });
}

function startMemoryMonitor(): void {
  if (memoryMonitorTimer !== null) {
    return;
  }

  memoryMonitorTimer = setInterval(pollMemoryHeadroom, MEMORY_POLL_INTERVAL_MS);
}

function stopMemoryMonitor(): void {
  if (memoryMonitorTimer !== null) {
    clearInterval(memoryMonitorTimer);
    memoryMonitorTimer = null;
  }
}

function handleAppStateForMemory(nextAppState: AppStateStatus): void {
  if (nextAppState === 'active') {
    startMemoryMonitor();
    return;
  }

  stopMemoryMonitor();

  if (nextAppState === 'background') {
    trimDecodedEmotes('reclaim');
  }
}

export function subscribeEmoteCacheMemoryPressure(): void {
  if (memoryPressureSubscribed) {
    return;
  }

  memoryPressureSubscribed = true;

  AppState.addEventListener('memoryWarning', () =>
    trimDecodedEmotes('reclaim'),
  );

  ImageMemoryPressure.addListener?.(
    'onMemoryPressure',
    handleNativeMemoryPressure,
  );

  subscribeToAppStateTransitions(({ current }) => {
    handleAppStateForMemory(current);
  });

  if (AppState.currentState === 'active') {
    startMemoryMonitor();
  }
}

type CachedEmoteStats = {
  decoded: number;
  inflight: number;
  pinned: number;
};

export function getCachedEmoteStats(): CachedEmoteStats {
  return { decoded: refs.size, inflight: inflight.size, pinned: pinned.size };
}

export function getCachedEmoteByteEstimate(): number {
  return totalBytes;
}

export function getEmoteRefReleaseRaceCount(): number {
  return releaseRaceCount;
}

export function getEmoteDecodeTimeoutCount(): number {
  return decodeTimeoutCount;
}
