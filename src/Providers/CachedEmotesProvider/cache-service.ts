/**
 * Decode-once, share-everywhere cache for chat inline images (emotes + badges).
 * Mirrors the swm-photos CachedPhotosProvider/cache-service split: this module
 * is the pure data layer (store/retrieve/evict), the provider owns lifecycle,
 * and useCachedEmote is the consumer hook.
 *
 * The same emote appears in many rows during a busy/raid chat. Rendering each as
 * `<Image source={{ uri }}>` makes every row do a cache lookup + go through the
 * load pipeline, and the cached bitmap is decoded at full source resolution.
 * Instead we decode each url ONCE via `Image.loadAsync(url, { maxWidth })` into a
 * shared, display-sized `ImageRef`, and render `<Image source={ref}>` so each row
 * just composites an already-decoded, size-bounded bitmap. Animated AVIFs keep
 * animating — the ref carries `isAnimated` and the view autoplays.
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
 * Upper bound on the decoded bitmap edge. Inline emotes render ~30pt (≈90px at
 * 3x) and badges smaller; loadAsync only downscales, so this never enlarges a
 * small image — it just caps the memory of oversized source art. Low-tier
 * devices cap tighter and keep fewer decoded entries to relieve memory.
 */
export const EMOTE_DECODE_MAX_PX = isLowTier ? 64 : 96;

const MAX_ENTRIES = isLowTier ? 1200 : 2400;

/**
 * Hard ceiling on resident decoded-bitmap memory. The entry count alone is a
 * poor proxy: a static badge costs ~tens of KB while an animated AVIF emote
 * holds a multi-frame working set that is an order of magnitude larger, so a
 * 1200-entry channel of animated emotes can dominate total process memory and
 * push the app past the iOS per-process limit (observed as a Hermes
 * heap-growth OOM, FOAM-TV-MOBILE-BG). The byte budget is the primary bound;
 * MAX_ENTRIES is now a backstop. Heuristic — tune against an on-device
 * Instruments Allocations / vmmap capture.
 *
 * Derived from device RAM (~5%) rather than a flat per-tier constant so the
 * working set scales down on smaller phones, clamped to per-tier bounds. Too
 * small a budget re-decodes the on-screen working set cold after every trim,
 * which reads as blank badge/emote slots in busy chats.
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
   * Intrinsic aspect ratio (logical width / height) captured off the decoded
   * ref, so the renderer can size emotes whose provider doesn't advertise
   * dimensions. Warm-decoded channel emotes usually have this before they
   * first render, so the common case corrects with no visible layout shift.
   */
  aspect: number | null;
};

const refs = new Map<string, CacheEntry>();
let totalBytes = 0;
const pinned = new Set<string>();
/**
 * Maps an in-flight url to the cacheEpoch active when its decode started.
 * clearCachedEmoteRefs bumps cacheEpoch, so a decode that resolves after a clear
 * is fenced out — it can't repopulate the cleared cache, and an old .finally
 * can't delete a newer request's inflight marker for the same url.
 */
const inflight = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
let cacheEpoch = 0;

const recentlyReleased = new Set<string>();
let releaseRaceCount = 0;

/**
 * Upper-bound decoded-bitmap cost without touching the ref: every native
 * ImageRef getter is a JSI hop, and reading one here was a measured JS-thread
 * hotspot during channel-load decode storms.
 */
function estimateRefBytes(animated: boolean, maxPx: number): number {
  const pixelBytes = maxPx * maxPx * 4;
  return Math.round(animated ? pixelBytes * ANIMATED_BYTE_FACTOR : pixelBytes);
}

const pendingReleases: { url: string; ref: ImageRef; frames: number }[] = [];
let releaseFlushScheduled = false;

/**
 * Frames a release may be re-queued for while a listener is still registered.
 * Enough to cover the mount race below, bounded so a url that stays subscribed
 * cannot defer its release forever.
 */
const MAX_RELEASE_DEFER_FRAMES = 2;

/**
 * One sweep per flush: a channel hop or pressure trim releases hundreds of
 * refs in one tick, too many for a pair of rAF closures each. A url stays
 * marked one to two frames, still covering the subscribe-after-release race
 * the marker exists to detect.
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
 * Native release is deferred a frame and re-checked. `useCachedEmote` registers
 * its subscription in a passive effect (asynchronously after the render that
 * reads the ref), so releasing synchronously on eviction can race that
 * subscription and detach a bitmap a mounted `<Image source={ref}>` is still
 * drawing — the emote, and an emote-only message, goes blank. By the next frame
 * the subscription exists, so an absent listener reliably means nothing holds
 * the ref. A released ref throws on any later native call, hence the try/catch.
 *
 * The re-queue is capped: every path that queues a release notifies first, so a
 * listener still present a couple of frames later has already fallen back to the
 * `uri` source. Unbounded, a memory-pressure trim freed nothing at all for an
 * emote that stayed on screen.
 */
function flushPendingReleases(): void {
  releaseFlushScheduled = false;
  const batch = pendingReleases.splice(0, pendingReleases.length);
  for (const pending of batch) {
    if (
      listeners.has(pending.url) &&
      pending.frames < MAX_RELEASE_DEFER_FRAMES
    ) {
      // A new subscriber raced in before this flush — re-queue so the ref is
      // retried next frame instead of being detached mid-draw.
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
 * Evict a url from the cache: drop it from the maps now and queue its native
 * bitmap for release so it deallocates without waiting for the JS GC (too late
 * under memory pressure). Returns whether the url was cached.
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
 * Evict least-recently-rendered unpinned refs until the incoming decode fits
 * under both the byte budget and the entry-count backstop. Stops once no
 * unpinned entry remains so a fully-pinned cache can still grow rather than spin.
 *
 * A live listener is skipped alongside a pin: `flushPendingReleases` won't free a
 * bitmap anything is subscribed to, so evicting one frees nothing while the
 * budget stops counting its bytes. The budget then under-reports and the cache
 * over-commits into real memory pressure.
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
 * A url whose warm (low-priority) decode is still queued can become visible
 * before it acquires a slot. Move its waiter into the normal queue so the
 * visible render is no longer stuck behind other warm work.
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
 * Intrinsic aspect ratio (width / height) of the decoded emote, or `null` if it
 * hasn't been decoded yet. Used to correct the layout box for emotes whose
 * provider doesn't advertise dimensions (Twitch, BTTV).
 */
export function getCachedEmoteAspectRatio(url: string): number | null {
  return refs.get(url)?.aspect ?? null;
}

/**
 * Re-inserts the entry at the end of the Map so eviction (which scans insertion
 * order) drops the least-recently-rendered ref, not the oldest-decoded one.
 * Kept out of getCachedEmoteRef so the useSyncExternalStore snapshot stays pure.
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
  // eslint-disable-next-line react-doctor/async-defer-await -- the slot must be acquired BEFORE the staleness re-check: a clear can happen while this decode is queued, and we only learn that after we own a slot
  await acquireDecodeSlot(url, lowPriority);
  try {
    if (requestEpoch !== cacheEpoch) {
      return;
    }
    // eslint-disable-next-line react-doctor/async-defer-await -- the staleness fence must re-check AFTER the decode resolves (a clear during the load must not repopulate the cache); this is the epoch fence the tests rely on
    const ref = await Image.loadAsync(
      { uri: url },
      { maxWidth: maxPx, maxHeight: maxPx },
    );
    if (inflight.get(url) !== requestEpoch || requestEpoch !== cacheEpoch) {
      // The decode outlived its epoch: release now, the GC lags exactly when
      // memory is tight.
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
    // Reading width/height off the ref is a JSI hop, but it's a one-off right
    // after the (far costlier) decode, and lets a dimensionless emote render at
    // its true aspect ratio instead of a 1:1 box.
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
  // Deleting the current key is well-defined during Map iteration, so this
  // sheds in a single pass; evictUnpinnedToFit relies on the same behaviour.
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
 * Fences every in-flight decode: results release on arrival instead of
 * caching, and clearing the inflight markers lets the same urls start fresh
 * decodes immediately. A channel hop calls this from the warm hook's cleanup -
 * everything in flight belongs to the channel being left, and a stale decode
 * would otherwise hold a slot the new channel needs and then land a ref
 * nothing reads. Memory trims must not call it: their in-flight decodes are
 * for rows still on screen.
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
   * Advisory trims keep refs with live listeners: the on-screen working set
   * is a bounded screenful, the memory win is the offscreen inventory, and
   * dropping a subscribed ref sends every mounted row through a cold
   * disk-read and decode-queue pass (blank-badge churn on constrained
   * devices). Free-memory-now signals (`memoryWarning`, backgrounding) never
   * set it.
   */
  keepSubscribed?: boolean;
  /**
   * Recurring triggers (the 5s poll, repeated onTrimMemory) throttle the wipe.
   * `memoryWarning` and backgrounding are free-memory-now signals: never set it.
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
 * 'advisory' trims come from recurring signals (the 5s headroom poll, Android
 * onTrimMemory): they keep refs mounted rows are subscribed to and throttle
 * the expo-image memory-cache wipe. 'reclaim' trims come from free-memory-now
 * signals (iOS memoryWarning, backgrounding): full shed, unthrottled wipe.
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
// Trimming can recur every poll under sustained pressure; throttle the Sentry
// breadcrumb so a constrained session can't flood Logs while still surfacing
// that pressure trims are happening.
const MEMORY_PRESSURE_LOG_THROTTLE_MS = 60_000;

let memoryMonitorTimer: ReturnType<typeof setInterval> | null = null;
let lastMemoryPressureLogAt = 0;

/**
 * Date.now here (not a monotonic clock) only gates a log; a clock jump at worst
 * drops or duplicates one breadcrumb.
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
 * Advisory, but with the expo-image wipe gated on the trim level: only
 * RUNNING_CRITICAL and above clears the memory cache, milder levels shed
 * refs only.
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
  // background/inactive: proactively shed the unpinned working set while
  // off-screen and stop polling so we don't run a timer in the background.
  stopMemoryMonitor();
  if (nextAppState === 'background') {
    trimDecodedEmotes('reclaim');
  }
}

/**
 * Registered once for the app's lifetime (the cache outlives any single chat
 * mount). Three triggers:
 * - iOS `memoryWarning`: late and unreliable before a fast OOM, so it can't be
 *   the only safety valve.
 * - Proactive headroom poll (foreground, every 5s): trims before the process
 *   hits its limit. iOS uses `os_proc_available_memory()`; Android uses
 *   system headroom above the low-memory-killer threshold.
 * - Android `onTrimMemory`: reactive trim. Android 14+ only delivers
 *   UI_HIDDEN/BACKGROUND/COMPLETE (all full-wipe); the RUNNING_* band still
 *   arrives on Android 13 and below, where RUNNING_LOW sheds refs only and
 *   RUNNING_CRITICAL+ also wipes the image cache.
 * - Backgrounding: shed the unpinned working set while off-screen so a long
 *   single-channel session can't sit at the cap until the OS reclaims it. Refs
 *   re-decode lazily on the next render when foregrounded.
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

export function getCachedEmoteStats(): {
  decoded: number;
  inflight: number;
  pinned: number;
} {
  return { decoded: refs.size, inflight: inflight.size, pinned: pinned.size };
}

/**
 * Estimated resident decoded-bitmap bytes, for the chat-perf harness.
 */
export function getCachedEmoteByteEstimate(): number {
  return totalBytes;
}

export function getEmoteRefReleaseRaceCount(): number {
  return releaseRaceCount;
}
