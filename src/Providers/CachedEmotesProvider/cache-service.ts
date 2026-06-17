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

// Bound the JS-side ref map independently of expo's native cache (which is
// bounded via Image.configureCache). Oldest insertion is evicted first.
const MAX_ENTRIES = 1200;

const refs = new Map<string, ImageRef>();
const inflight = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

function notify(url: string): void {
  listeners.get(url)?.forEach(cb => cb());
}

function notifyAll(): void {
  listeners.forEach(set => set.forEach(cb => cb()));
}

export function getCachedEmoteRef(url: string): ImageRef | null {
  return refs.get(url) ?? null;
}

export function ensureCachedEmoteRef(
  url: string,
  maxPx: number = EMOTE_DECODE_MAX_PX,
): void {
  if (!url || refs.has(url) || inflight.has(url)) {
    return;
  }
  inflight.add(url);
  Image.loadAsync({ uri: url }, { maxWidth: maxPx, maxHeight: maxPx })
    .then(ref => {
      if (refs.size >= MAX_ENTRIES) {
        const oldest = refs.keys().next().value;
        if (oldest !== undefined) {
          refs.delete(oldest);
        }
      }
      refs.set(url, ref);
      notify(url);
    })
    .catch(() => undefined)
    .finally(() => inflight.delete(url));
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

// Awaitable batch warm used by the provider to optimise a channel's emote set
// up front (like swm-photos' batched mipmap calculation), so the most common
// emotes are already decoded before their first message arrives.
export async function warmCachedEmoteRefs(
  urls: string[],
  maxPx: number = EMOTE_DECODE_MAX_PX,
): Promise<void> {
  await Promise.all(
    urls.map(url => {
      if (!url || refs.has(url) || inflight.has(url)) {
        return undefined;
      }
      inflight.add(url);
      return Image.loadAsync(
        { uri: url },
        { maxWidth: maxPx, maxHeight: maxPx },
      )
        .then(ref => {
          if (refs.size >= MAX_ENTRIES) {
            const oldest = refs.keys().next().value;
            if (oldest !== undefined) {
              refs.delete(oldest);
            }
          }
          refs.set(url, ref);
          notify(url);
        })
        .catch(() => undefined)
        .finally(() => inflight.delete(url));
    }),
  );
}

// Releases all decoded refs (native bitmaps are freed once unreferenced) and
// notifies mounted consumers so any row holding one drops its now-dangling ref
// and falls back to the url. Called on channel change to bound memory across
// channel hops, and whenever the native image cache is cleared.
export function clearCachedEmoteRefs(): void {
  refs.clear();
  inflight.clear();
  notifyAll();
}

export function getCachedEmoteStats(): { decoded: number; inflight: number } {
  return { decoded: refs.size, inflight: inflight.size };
}
