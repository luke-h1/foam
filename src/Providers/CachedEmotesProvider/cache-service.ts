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
import { AppState } from 'react-native';

import { Image, type ImageRef } from 'expo-image';

import { getDeviceTier } from '@app/utils/device/deviceTier';
import { logger } from '@app/utils/logger';

const isLowTier = getDeviceTier() === 'low';

/**
 * Upper bound on the decoded bitmap edge. Inline emotes render ~30pt (≈90px at
 * 3x) and badges smaller; loadAsync only downscales, so this never enlarges a
 * small image — it just caps the memory of oversized source art. Low-tier
 * devices cap tighter and keep fewer decoded entries to relieve memory.
 */
export const EMOTE_DECODE_MAX_PX = isLowTier ? 64 : 96;

const MAX_ENTRIES = isLowTier ? 600 : 1200;

/**
 * Hard ceiling on resident decoded-bitmap memory. The entry count alone is a
 * poor proxy: a static badge costs ~tens of KB while an animated AVIF emote
 * holds a multi-frame working set that is an order of magnitude larger, so a
 * 1200-entry channel of animated emotes can dominate total process memory and
 * push the app past the iOS per-process limit (observed as a Hermes
 * heap-growth OOM, FOAM-TV-MOBILE-BG). The byte budget is the primary bound;
 * MAX_ENTRIES is now a backstop. Heuristic — tune against an on-device
 * Instruments Allocations / vmmap capture.
 */
const MAX_DECODED_BYTES = isLowTier ? 64 * 1024 * 1024 : 192 * 1024 * 1024;
const FALLBACK_REF_BYTES = 48 * 1024;
const ANIMATED_BYTE_FACTOR = 8;

const refs = new Map<string, ImageRef>();
const refBytes = new Map<string, number>();
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

function estimateRefBytes(ref: ImageRef): number {
  const { width, height } = ref;
  if (!width || !height) {
    return FALLBACK_REF_BYTES;
  }
  const scale = ref.scale || 1;
  const pixelBytes = width * scale * height * scale * 4;
  return Math.round(
    ref.isAnimated ? pixelBytes * ANIMATED_BYTE_FACTOR : pixelBytes,
  );
}

function dropRefBytes(url: string): void {
  const cost = refBytes.get(url);
  if (cost !== undefined) {
    totalBytes -= cost;
    refBytes.delete(url);
  }
}

const pendingReleases: { url: string; ref: ImageRef }[] = [];
let releaseFlushScheduled = false;

function markRecentlyReleased(url: string): void {
  recentlyReleased.add(url);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      recentlyReleased.delete(url);
    });
  });
}

/**
 * Native release is deferred a frame and re-checked. `useCachedEmote` registers
 * its subscription in a passive effect (asynchronously after the render that
 * reads the ref), so releasing synchronously on eviction can race that
 * subscription and detach a bitmap a mounted `<Image source={ref}>` is still
 * drawing — the emote, and an emote-only message, goes blank. By the next frame
 * the subscription exists, so an absent listener reliably means nothing holds
 * the ref. A released ref throws on any later native call, hence the try/catch.
 */
function flushPendingReleases(): void {
  releaseFlushScheduled = false;
  const batch = pendingReleases.splice(0, pendingReleases.length);
  for (const { url, ref } of batch) {
    if (listeners.has(url)) {
      // A new subscriber raced in before this flush — re-queue so the ref is
      // retried next frame instead of leaking when that subscriber leaves.
      pendingReleases.push({ url, ref });
      continue;
    }
    try {
      ref.release();
    } catch {
      // ignore
    }
    markRecentlyReleased(url);
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
  const ref = refs.get(url);
  if (ref) {
    pendingReleases.push({ url, ref });
    if (!releaseFlushScheduled) {
      releaseFlushScheduled = true;
      requestAnimationFrame(flushPendingReleases);
    }
  }
  dropRefBytes(url);
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
 */
function evictUnpinnedToFit(incomingBytes: number): void {
  if (withinBudget(incomingBytes)) {
    return;
  }
  for (const url of refs.keys()) {
    if (withinBudget(incomingBytes)) {
      return;
    }
    if (pinned.has(url)) {
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
  return refs.get(url) ?? null;
}

/**
 * Re-inserts the entry at the end of the Map so eviction (which scans insertion
 * order) drops the least-recently-rendered ref, not the oldest-decoded one.
 * Kept out of getCachedEmoteRef so the useSyncExternalStore snapshot stays pure.
 */
export function touchCachedEmoteRef(url: string): void {
  const ref = refs.get(url);
  if (ref !== undefined) {
    refs.delete(url);
    refs.set(url, ref);
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
      return;
    }
    const cost = estimateRefBytes(ref);
    evictUnpinnedToFit(cost);
    refs.set(url, ref);
    refBytes.set(url, cost);
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

export function releaseChannelEmoteRefs(): void {
  const dropped: string[] = [];
  for (const url of refs.keys()) {
    if (!pinned.has(url)) {
      dropped.push(url);
    }
  }
  dropped.forEach(url => {
    releaseRef(url);
    notify(url);
  });
}

export function clearCachedEmoteRefs(): void {
  cacheEpoch += 1;
  for (const url of refs.keys()) {
    releaseRef(url);
  }
  refs.clear();
  refBytes.clear();
  totalBytes = 0;
  inflight.clear();
  pinned.clear();
  recentlyReleased.clear();
  releaseRaceCount = 0;
  notifyAll();
}

/**
 * Under memory pressure, shed every unpinned decoded bitmap (channel emotes
 * re-decode lazily on next render) and drop expo-image's in-memory cache. The
 * hard-referenced `refs` map otherwise never yields to the OS, so on a
 * constrained device this is the difference between trimming and being jettisoned.
 */
export function trimCachedEmoteRefsForMemoryPressure(): void {
  releaseChannelEmoteRefs();
  void Image.clearMemoryCache();
}

let memoryPressureSubscribed = false;

/**
 * Registered once for the app's lifetime (the cache outlives any single chat
 * mount). Two triggers:
 * - iOS `memoryWarning`: late and unreliable before a fast OOM, so it can't be
 *   the only safety valve.
 * - Backgrounding: proactively shed the unpinned working set while the app is
 *   off-screen so a long single-channel session can't sit at the cap until the
 *   OS reclaims it. Refs re-decode lazily on the next render when foregrounded.
 * Android trim hooks would need a native onTrimMemory bridge — not wired here.
 */
export function subscribeEmoteCacheMemoryPressure(): void {
  if (memoryPressureSubscribed) {
    return;
  }
  memoryPressureSubscribed = true;
  AppState.addEventListener(
    'memoryWarning',
    trimCachedEmoteRefsForMemoryPressure,
  );
  AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'background') {
      trimCachedEmoteRefsForMemoryPressure();
    }
  });
}

export function getCachedEmoteStats(): {
  decoded: number;
  inflight: number;
  pinned: number;
} {
  return { decoded: refs.size, inflight: inflight.size, pinned: pinned.size };
}

/** Estimated resident decoded-bitmap bytes, for the chat-perf harness. */
export function getCachedEmoteByteEstimate(): number {
  return totalBytes;
}

export function getEmoteRefReleaseRaceCount(): number {
  return releaseRaceCount;
}
