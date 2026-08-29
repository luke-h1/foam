/**
 * Decode-once cache for chat emotes and badges: one shared display-sized
 * ImageRef per url instead of every row decoding the full-resolution source.
 */
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { Image, type ImageRef } from 'expo-image';

import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';
import {
  getDeviceTier,
  getTotalDeviceMemoryBytes,
} from '@app/utils/device/deviceTier';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { logger } from '@app/utils/logger';
import type { ImageMemoryPressureEvent } from '@modules/image-memory-pressure/src/ImageMemoryPressure.types';
import ImageMemoryPressure from '@modules/image-memory-pressure/src/ImageMemoryPressureModule';

const isLowTier = getDeviceTier() === 'low';

/**
 * Decoded bitmap edge cap; inline emotes render ~30pt (~90px at 3x) and
 * loadAsync only downscales, so this bounds memory without enlarging small art.
 */
export const EMOTE_DECODE_MAX_PX = isLowTier ? 64 : 96;

const MAX_ENTRIES = isLowTier ? 1200 : 2400;

/**
 * Primary byte budget, ~5% of device RAM clamped to per-tier bounds; entry
 * count alone under-counted animated emotes and OOM'd iOS (FOAM-TV-MOBILE-BG).
 */
const MAX_DECODED_BYTES = (() => {
  const ceil = isLowTier ? 128 * 1024 * 1024 : 600 * 1024 * 1024;
  const floor = isLowTier ? 96 * 1024 * 1024 : 192 * 1024 * 1024;
  const totalMemoryBytes = getTotalDeviceMemoryBytes();
  if (totalMemoryBytes <= 0) {
    return ceil;
  }
  return Math.max(floor, Math.min(ceil, Math.floor(totalMemoryBytes * 0.05)));
})();
const ANIMATED_BYTE_FACTOR = 8;

type CacheEntry = {
  ref: ImageRef;
  bytes: number;
  /**
   * Intrinsic width / height, so the renderer can size emotes whose provider
   * gives no dimensions.
   */
  aspect: number | null;
};

const refs = new Map<string, CacheEntry>();
let totalBytes = 0;
const pinned = new Set<string>();
/**
 * In-flight url -> cacheEpoch at decode start; a clear bumps the epoch so a
 * late decode cannot repopulate the cache or delete a newer request's marker.
 */
const inflight = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
let cacheEpoch = 0;

const recentlyReleased = new Set<string>();
let releaseRaceCount = 0;

/**
 * Estimates cost without touching the ref: ImageRef getters are JSI hops and
 * were a measured hotspot during decode storms.
 */
function estimateRefBytes(animated: boolean, maxPx: number): number {
  const pixelBytes = maxPx * maxPx * 4;
  return Math.round(animated ? pixelBytes * ANIMATED_BYTE_FACTOR : pixelBytes);
}

const pendingReleases: { url: string; ref: ImageRef; frames: number }[] = [];
let releaseFlushScheduled = false;

/**
 * Covers the mount race below, bounded so a subscribed url cannot defer its
 * release forever.
 */
const MAX_RELEASE_DEFER_FRAMES = 2;

/**
 * One sweep per flush: a channel hop releases hundreds of refs in one tick;
 * urls stay marked 1-2 frames for the subscribe-after-release race check.
 */
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

/**
 * Release is deferred a frame: a synchronous release can detach a bitmap a
 * mounted Image still draws (blank emote).
 */
function flushPendingReleases(): void {
  releaseFlushScheduled = false;
  const batch = pendingReleases.splice(0, pendingReleases.length);
  for (const pending of batch) {
    if (
      listeners.has(pending.url) &&
      pending.frames < MAX_RELEASE_DEFER_FRAMES
    ) {
      // A subscriber raced in - retry next frame instead of detaching mid-draw.
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

/**
 * Drops the url now and queues the native release; waiting for JS GC is too
 * late under memory pressure. Returns whether the url was cached.
 */
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

/**
 * Evicts least-recently-rendered unpinned, unsubscribed refs until the decode
 * fits; releasing a live listener's ref frees nothing yet uncounts its bytes.
 */
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
let activeDecodes = 0;
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

/**
 * A queued warm decode can become visible; move its waiter to the normal queue
 * so the visible render is not stuck behind other warm work.
 */
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

function notify(url: string): void {
  listeners.get(url)?.forEach(cb => cb());
}

function notifyAll(): void {
  listeners.forEach(set => set.forEach(cb => cb()));
}

export function getCachedEmoteRef(url: string): ImageRef | null {
  return refs.get(url)?.ref ?? null;
}

/**
 * Intrinsic width / height of the decoded emote, or null if not decoded yet;
 * sizes emotes whose provider gives no dimensions (Twitch, BTTV).
 */
export function getCachedEmoteAspectRatio(url: string): number | null {
  return refs.get(url)?.aspect ?? null;
}

/**
 * Re-inserts at the Map's end so eviction drops the least-recently-rendered
 * ref; kept out of getCachedEmoteRef so the store snapshot stays pure.
 */
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
  if (!url || refs.has(url) || inflight.has(url)) {
    if (pin && refs.has(url)) {
      pinned.add(url);
    }
    if (url && !lowPriority && inflight.has(url)) {
      promoteDecodeWaiter(url);
    }
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
  // eslint-disable-next-line react-doctor/async-defer-await -- slot first, then staleness re-check
  await acquireDecodeSlot(url, lowPriority);
  try {
    if (requestEpoch !== cacheEpoch) {
      return;
    }
    // eslint-disable-next-line react-doctor/async-defer-await -- epoch fence re-checks after the decode
    const ref = await Image.loadAsync(
      { uri: url },
      { maxWidth: maxPx, maxHeight: maxPx },
    );
    if (inflight.get(url) !== requestEpoch || requestEpoch !== cacheEpoch) {
      // Decode outlived its epoch: release now, GC lags when memory is tight.
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
    // width/height is a JSI hop, but a one-off after the far costlier decode.
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
  } catch {
    // ignore
  } finally {
    releaseDecodeSlot();
    if (inflight.get(url) === requestEpoch) {
      inflight.delete(url);
    }
  }
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
    releaseRaceCount += 1;
    if (releaseRaceCount === 1 || releaseRaceCount % 50 === 0) {
      logger.chat.warn('chat.emote.ref_release_race', {
        name: 'chat_resources_warning',
        url,
        count: releaseRaceCount,
      });
    }
  }
  let set = listeners.get(url);
  if (!set) {
    set = new Set();
    listeners.set(url, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
    if (set && set.size === 0) {
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
  // Deleting the current key during Map iteration is well-defined.
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

/**
 * Fences in-flight decodes on channel hop so stale results release on arrival;
 * memory trims must not call it - their decodes are for rows still on screen.
 */
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
  releaseRaceCount = 0;
  notifyAll();
}

const IMAGE_CACHE_CLEAR_THROTTLE_MS = 30_000;
let lastImageCacheClearAt = 0;

type MemoryPressureTrimOptions = {
  /**
   * Shed refs but keep the expo-image cache; advisory trim levels use this.
   */
  clearImageCache?: boolean;
  /**
   * Advisory trims keep subscribed refs - dropping one cold-decodes every
   * mounted row. Free-memory-now signals never set it.
   */
  keepSubscribed?: boolean;
  /**
   * Recurring triggers throttle the wipe; memoryWarning and backgrounding are
   * free-memory-now signals and never set it.
   */
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

export type TrimDecodedEmotesReason = 'advisory' | 'reclaim';

/**
 * 'advisory' keeps subscribed refs and throttles the image-cache wipe;
 * 'reclaim' (memoryWarning, backgrounding) is a full unthrottled shed.
 */
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
// Trims can recur every poll; throttle so a constrained session can't flood Sentry Logs.
const MEMORY_PRESSURE_LOG_THROTTLE_MS = 60_000;

let memoryMonitorTimer: ReturnType<typeof setInterval> | null = null;
let lastMemoryPressureLogAt = 0;

/**
 * Date.now only gates a log; a clock jump at worst drops or duplicates one
 * breadcrumb.
 */
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

/**
 * Advisory, but only RUNNING_CRITICAL and above also clears the expo-image
 * memory cache; milder levels shed refs only.
 */
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

/**
 * Registered once for the app's lifetime; iOS memoryWarning fires too late
 * before a fast OOM, so the 5s headroom poll trims proactively.
 */
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
