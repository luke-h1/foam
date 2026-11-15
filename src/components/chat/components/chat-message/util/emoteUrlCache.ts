import {
  describeEmoteUrl,
  type EmoteUrlDescriptor,
} from '@app/utils/emote/describeEmoteUrl';
import { buildImageFallbackChain } from '@app/utils/emote/imageFallbackChain';

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

export const getEmoteUrlKind = cacheByUrl<EmoteUrlDescriptor['kind']>(
  url => describeEmoteUrl(url).kind,
  2048,
);

export const getImageFallbackChain = cacheByUrl(buildImageFallbackChain, 1024);
