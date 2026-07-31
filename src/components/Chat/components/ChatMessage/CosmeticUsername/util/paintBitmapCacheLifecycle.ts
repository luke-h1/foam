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
 * Caps entries, not textures - one entry owns a foundation bitmap plus an
 * optional mask, stroke, and a baked bitmap per gradient run above a URL layer.
 */
export const MAX_CACHED_PAINT_BITMAPS = 256;

const cache = new Map<string, DisposablePaintBitmaps>();

/**
 * Retain counts for entries a mounted canvas is still drawing. Eviction only
 * unlinks an entry from the cache; the last release frees its textures.
 */
const retainCounts = new Map<DisposablePaintBitmaps, number>();

/**
 * Evicted, not yet freed. `PaintedUsernameSkia` retains in a layout effect, so
 * the retain lands in the same commit as the render that read the entry — but
 * a concurrent render can be interrupted between the two, so disposal is still
 * deferred two frames rather than running on eviction.
 */
const pendingDisposal = new Set<DisposablePaintBitmaps>();
let disposalFlushScheduled = false;

/**
 * Lets a retain that lost the race above find out its textures are gone,
 * rather than handing a dead entry to a canvas.
 */
const disposedEntries = new WeakSet<DisposablePaintBitmaps>();

function disposeTextures(entry: DisposablePaintBitmaps): void {
  disposedEntries.add(entry);
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
    const oldest = cache.entries().next().value;
    if (oldest) {
      const [oldestKey, oldestEntry] = oldest;
      cache.delete(oldestKey);
      scheduleDisposal(oldestEntry);
    }
  }
  cache.set(key, entry);
}

/**
 * Pins an entry's textures for as long as a canvas draws them. Returns false if
 * the entry was disposed before this retain landed — the caller must rebuild
 * rather than draw it, which keeps the eviction race recoverable instead of
 * putting a dead texture on screen.
 */
export function retainPaintBitmaps(entry: DisposablePaintBitmaps): boolean {
  if (disposedEntries.has(entry)) {
    return false;
  }
  retainCounts.set(entry, (retainCounts.get(entry) ?? 0) + 1);
  return true;
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
