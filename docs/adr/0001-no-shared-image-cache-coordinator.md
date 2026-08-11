# Keep the decoded-emote cache and the file image cache separate

Foam has two image caches — `Providers/CachedEmotesProvider/cache-service.ts`
(decode-once `ImageRef` cache for inline chat emotes) and
`utils/image/image-cache.ts` (on-disk file cache for avatars/thumbnails/badges).
They superficially share four concerns (LRU eviction, byte-budget accounting, a
concurrency limiter, in-flight dedup), so extracting a shared "cache coordinator"
looks attractive.

We deliberately do **not** share a coordinator. On close reading the concerns
have diverged for real reasons:

- **Scheduling**: the decoded cache uses a plain FIFO decode-semaphore; the file
  cache uses a priority (`visible`/`interactive`/`background`) + `AbortSignal`
  download queue.
- **Invalidation/dedup**: the decoded cache uses an epoch-fenced numeric in-flight
  marker so `clearCachedEmoteRefs` can cancel in-flight decodes; the file cache
  uses a promise single-flight that returns the in-flight promise.
- **Eviction**: the decoded cache evicts in Map-insertion (LRU-touch) order and
  releases native bitmaps a frame later (to avoid blanking a mounted `<Image>`);
  the file cache sorts by `lastAccessed` and deletes files.

A shared module would have to support the union of all of these, making it larger
than the duplication it removes, and it would couple two independently
memory-tuned hot paths (both are load-bearing for the iOS OOM work in
FOAM-TV-MOBILE-BG). This fails the two-adapter test: the policies rhyme but do not
actually vary across one stable interface.

## Consequences

The ~10-line eviction loop and the concurrency limiter remain duplicated in shape
across the two files. That is accepted: each is small, each is tuned for its own
constraints, and each is changed for different reasons.

## Amendment (2026-08): four caches, separation unchanged

The full cache inventory is four, not two: the decoded `ImageRef` cache
(`cache-service.ts`), the MMKV-manifested file cache (`image-cache.ts`), the
Skia paint bitmap cache (`paintBitmapCacheLifecycle.ts`), and expo-image's own
memory/disk caches. The separation decision above is unchanged - none of them
share a coordinator. What did change:

- The file cache's download queue is now a plain FIFO with the same concurrency
  and `AbortSignal` handling; the `visible`/`interactive`/`background` priority
  ranking was dead (every live caller passed `visible`), so the scheduling
  bullet above no longer distinguishes the two queues.
- `utils/image/clearImageCache.ts` is the one user-facing clear and empties all
  four caches. Clearing a subset left the file-cache manifest serving stale
  `file://` records after an expo-image wipe.
- `utils/image/prefetchToDisk.ts` is the only expo-image prefetch entry point;
  the "never 'memory-disk'" rule lives there.
