import {
  describeEmoteUrl,
  type EmoteUrlDescriptor,
} from '@app/utils/emote/describe-emote-url';
import { buildImageFallbackChain } from '@app/utils/emote/image-fallback-chain';

/**
 * Caches a pure function of an emote url. One emote can show in hundreds of
 * rows, so the work runs once per url instead of once per mount. When the map
 * is full it is cleared.
 */
function cacheByUrl<TValue>(
  build: (url: string) => TValue,
  maxSize: number,
): (url: string) => TValue {
  const cache = new Map<string, TValue>();

  return url => {
    const cached = cache.get(url);

    if (cached !== undefined) {
      return cached;
    }

    if (cache.size >= maxSize) {
      cache.clear();
    }

    const value = build(url);
    cache.set(url, value);
    return value;
  };
}

/**
 * Whether a url names an animated or a static emote.
 */
export const getEmoteUrlKind = cacheByUrl<EmoteUrlDescriptor['kind']>(
  url => describeEmoteUrl(url).kind,
  2048,
);

export const getImageFallbackChain = cacheByUrl(buildImageFallbackChain, 1024);
