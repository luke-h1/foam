/**
 * Skia paint bitmap cache lives here so `clearImageCache` can empty it without
 * importing the Skia rasterizer (keeps web / non-skia bundles free of that
 * dependency). Values are `PaintBitmaps` from the rasterizer.
 */

interface DisposableTexture {
  dispose(): void;
}

/**
 * The disposable surface of `PaintBitmaps`. Declared structurally so this
 * module never reaches for Skia, while a renamed or retyped field in the
 * rasterizer still fails the typecheck at the `cachePaintBitmaps` call.
 */
export interface DisposablePaintBitmaps {
  staticImage: DisposableTexture;
  maskImage: DisposableTexture | null;
  strokeImage: DisposableTexture | null;
  layerSlots: ({ kind: 'baked'; image: DisposableTexture } | { kind: 'url' })[];
}

/**
 * Bounded LRU over cache *entries*, not textures: each entry owns a foundation
 * bitmap plus an optional mask, stroke, and one baked bitmap per gradient run
 * that stacks above a URL layer. 7TV serves a few hundred paints in total, so
 * 256 entries covers a chat session's working set.
 */
export const MAX_CACHED_PAINT_BITMAPS = 256;

const cache = new Map<string, DisposablePaintBitmaps>();

/**
 * Retain counts for entries a mounted canvas is still drawing. Eviction only
 * unlinks an entry from the cache; the last release frees its textures.
 */
const retainCounts = new Map<DisposablePaintBitmaps, number>();

/**
 * Evicted, not yet freed. Disposal is deferred two frames because
 * `PaintedUsernameSkia` retains in a passive effect, asynchronously after the
 * render that read the entry — freeing on eviction can race that effect and
 * hand an already-disposed texture to a canvas that is about to mount. By the
 * next frame the retain has landed, so an absent count reliably means nothing
 * is drawing it.
 */
const pendingDisposal = new Set<DisposablePaintBitmaps>();
let disposalFlushScheduled = false;

function disposeTextures(entry: DisposablePaintBitmaps): void {
  entry.staticImage.dispose();
  entry.maskImage?.dispose();
  entry.strokeImage?.dispose();
  for (const slot of entry.layerSlots) {
    if (slot.kind === 'baked') {
      slot.image.dispose();
    }
  }
}

function flushPendingDisposal(): void {
  disposalFlushScheduled = false;
  for (const entry of [...pendingDisposal]) {
    if (retainCounts.has(entry)) {
      // A canvas mounted onto this entry after it was evicted; the matching
      // release frees it instead.
      continue;
    }
    pendingDisposal.delete(entry);
    disposeTextures(entry);
  }
}

function scheduleDisposal(entry: DisposablePaintBitmaps): void {
  pendingDisposal.add(entry);
  if (disposalFlushScheduled) {
    return;
  }
  disposalFlushScheduled = true;
  requestAnimationFrame(() => {
    requestAnimationFrame(flushPendingDisposal);
  });
}

/**
 * Map iteration order is insertion order, so re-inserting on a hit keeps
 * eviction least-recently-used rather than first-inserted.
 */
export function getCachedPaintBitmaps(
  key: string,
): DisposablePaintBitmaps | undefined {
  const entry = cache.get(key);
  if (entry === undefined) {
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

export function cachePaintBitmaps(
  key: string,
  entry: DisposablePaintBitmaps,
): void {
  if (cache.size >= MAX_CACHED_PAINT_BITMAPS) {
    const oldestKey = cache.keys().next().value;
    const oldest = oldestKey === undefined ? undefined : cache.get(oldestKey);
    if (oldestKey !== undefined && oldest !== undefined) {
      cache.delete(oldestKey);
      scheduleDisposal(oldest);
    }
  }
  cache.set(key, entry);
}

export function retainPaintBitmaps(entry: DisposablePaintBitmaps): void {
  retainCounts.set(entry, (retainCounts.get(entry) ?? 0) + 1);
}

export function releasePaintBitmaps(entry: DisposablePaintBitmaps): void {
  const remaining = (retainCounts.get(entry) ?? 0) - 1;
  if (remaining > 0) {
    retainCounts.set(entry, remaining);
    return;
  }
  retainCounts.delete(entry);
  if (pendingDisposal.delete(entry)) {
    disposeTextures(entry);
  }
}

/**
 * Drop cached paint bitmaps (session reset / clear image cache / memory
 * warning). Entries still on screen are freed by their last release.
 */
export function clearPaintBitmapCache(): void {
  for (const entry of cache.values()) {
    scheduleDisposal(entry);
  }
  cache.clear();
}
