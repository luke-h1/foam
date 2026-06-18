// Decode-once, share-everywhere cache for chat inline images (emotes + badges).
// Mirrors the swm-photos CachedPhotosProvider/cache-service split: this module
// is the pure data layer (store/retrieve/evict), the provider owns lifecycle,
// and useCachedEmote is the consumer hook.
//
// The same emote appears in many rows during a busy/raid chat. Rendering each as
// `<Image source={{ uri }}>` makes every row do a cache lookup + go through the
// load pipeline, and the cached bitmap is decoded at full source resolution.
// Instead we decode each url ONCE via `Image.loadAsync(url, { maxWidth })` into a
// shared, display-sized `ImageRef`, and render `<Image source={ref}>` so each row
// just composites an already-decoded, size-bounded bitmap. Animated AVIFs keep
// animating — the ref carries `isAnimated` and the view autoplays.
import { Image, type ImageRef } from 'expo-image';

// Upper bound on the decoded bitmap edge. Inline emotes render ~30pt (≈90px at
// 3x) and badges smaller; loadAsync only downscales, so this never enlarges a
// small image — it just caps the memory of oversized source art.
export const EMOTE_DECODE_MAX_PX = 96;

/**
 * Bound the JS-side ref map independently of expo's native cache (which is
 * bounded via Image.configureCache). Oldest non-pinned insertion is evicted
 * first; pinned entries (see `pinned`) are never evicted by the cap.
 */
const MAX_ENTRIES = 1200;

const refs = new Map<string, ImageRef>();
/**
 * Global emote urls that survive a channel hop and are never cap-evicted, so the
 * common set is decoded once per session. Must stay « MAX_ENTRIES (else the cap
 * can't reclaim). Only a full clearCachedEmoteRefs drops them.
 */
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

function evictOneUnpinned(): void {
  for (const url of refs.keys()) {
    if (!pinned.has(url)) {
      refs.delete(url);
      return;
    }
  }
}

/**
 * Cap simultaneous decodes so a raid's burst of never-seen emotes can't fire
 * hundreds of parallel loadAsync calls (decode-buffer memory spike + JS churn).
 */
const MAX_CONCURRENT_DECODES = 8;
let activeDecodes = 0;
const decodeWaiters: (() => void)[] = [];

function acquireDecodeSlot(): Promise<void> {
  if (activeDecodes < MAX_CONCURRENT_DECODES) {
    activeDecodes += 1;
    return Promise.resolve();
  }
  return new Promise<void>(resolve => {
    decodeWaiters.push(resolve);
  });
}

function releaseDecodeSlot(): void {
  const next = decodeWaiters.shift();
  if (next) {
    next();
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

function decodeInto(url: string, maxPx: number, pin: boolean): Promise<void> {
  if (!url || refs.has(url) || inflight.has(url)) {
    if (pin && refs.has(url)) {
      pinned.add(url);
    }
    return Promise.resolve();
  }
  const requestEpoch = cacheEpoch;
  // Synchronous before the first await so concurrent callers dedupe immediately.
  inflight.set(url, requestEpoch);
  return runDecode(url, maxPx, pin, requestEpoch);
}

async function runDecode(
  url: string,
  maxPx: number,
  pin: boolean,
  requestEpoch: number,
): Promise<void> {
  // eslint-disable-next-line react-doctor/async-defer-await -- the slot must be acquired BEFORE the staleness re-check: a clear can happen while this decode is queued, and we only learn that after we own a slot
  await acquireDecodeSlot();
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
    if (refs.size >= MAX_ENTRIES) {
      evictOneUnpinned();
    }
    refs.set(url, ref);
    if (pin) {
      pinned.add(url);
    }
    notify(url);
  } catch {
    // decode failed — leave uncached
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

/**
 * Awaitable batch warm used by the provider to optimise an emote set up front
 * (like swm-photos' batched mipmap calculation), so the most common emotes are
 * already decoded before their first message arrives. `pin: true` marks the set
 * as session-global so it survives channel hops (see `pinned`).
 */
export async function warmCachedEmoteRefs(
  urls: string[],
  {
    maxPx = EMOTE_DECODE_MAX_PX,
    pin = false,
  }: { maxPx?: number; pin?: boolean } = {},
): Promise<void> {
  await Promise.all(urls.map(url => decodeInto(url, maxPx, pin)));
}

/**
 * Channel-hop release: drops the channel-specific refs (notifying those rows to
 * fall back to the url) but keeps the pinned global set decoded.
 */
export function releaseChannelEmoteRefs(): void {
  const dropped: string[] = [];
  for (const url of refs.keys()) {
    if (!pinned.has(url)) {
      dropped.push(url);
    }
  }
  dropped.forEach(url => {
    refs.delete(url);
    notify(url);
  });
}

/**
 * Full clear including pinned globals; for when the native image cache is wiped,
 * so no ref dangles at a freed bitmap. Notifies all mounted rows to fall back.
 */
export function clearCachedEmoteRefs(): void {
  cacheEpoch += 1;
  refs.clear();
  inflight.clear();
  pinned.clear();
  notifyAll();
}

export function getCachedEmoteStats(): {
  decoded: number;
  inflight: number;
  pinned: number;
} {
  return { decoded: refs.size, inflight: inflight.size, pinned: pinned.size };
}
