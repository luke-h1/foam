import type { SanitisedEmote } from '@app/types/emote';
import { getEmoteImageCacheUrls } from '@app/utils/emote/emoteImageVariants';
import type { CacheImageOptions } from '@app/utils/image/image-cache';
import {
  clearSessionCache,
  getCachedImageUri,
  warmImageCache,
} from '@app/utils/image/image-cache';

export const cacheEmoteImages = async (
  emotes: SanitisedEmote[],
  signal?: AbortSignal,
  priority: CacheImageOptions['priority'] = 'interactive',
): Promise<void> => {
  if (emotes.length === 0 || signal?.aborted) {
    return;
  }

  const urlsToCache: string[] = [];
  const seen = new Set<string>();

  emotes.forEach(emote => {
    getEmoteImageCacheUrls(emote).forEach(url => {
      if (
        seen.has(url) ||
        url.startsWith('data:') ||
        url.startsWith('file://') ||
        getCachedImageUri(url, { variant: 'emote' })
      ) {
        return;
      }

      seen.add(url);
      urlsToCache.push(url);
    });
  });

  if (urlsToCache.length === 0) {
    return;
  }

  warmImageCache(urlsToCache, { priority, signal, variant: 'emote' });
};

export const clearEmoteImageCache = (): void => {
  clearSessionCache();
};
