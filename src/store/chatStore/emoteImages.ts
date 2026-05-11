import type { SanitisedEmote } from '@app/types/emote';
import type { CacheImageOptions } from '@app/utils/image/image-cache';
import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
  warmImageCache,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';

const emoteImageCachePromises = new Map<string, Promise<string>>();

export const cacheEmoteImage = async (
  emoteUrl: string,
  options: CacheImageOptions = {},
): Promise<string> => {
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }
  const existingFileUri = getCachedImageUri(emoteUrl);
  if (existingFileUri) {
    return existingFileUri;
  }
  const inProgress = emoteImageCachePromises.get(emoteUrl);

  if (inProgress) {
    return inProgress;
  }

  const cachePromise = (async () => {
    try {
      const fileUri = await cacheImageFromUrl(emoteUrl, {
        priority: options.priority ?? 'visible',
        signal: options.signal,
        variant: options.variant,
      });
      emoteImageCachePromises.delete(emoteUrl);
      return fileUri;
    } catch (error) {
      emoteImageCachePromises.delete(emoteUrl);
      logger.chat.warn(
        `Failed to cache emote image ${emoteUrl.substring(0, 50)}...:`,
        error,
      );
      return emoteUrl;
    }
  })();

  emoteImageCachePromises.set(emoteUrl, cachePromise);
  return cachePromise;
};

export const getCachedEmoteUri = (emoteUrl: string): string => {
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }
  const cachedUri = getCachedImageUri(emoteUrl);
  return cachedUri ?? emoteUrl;
};

export const cacheEmoteImages = async (
  emotes: SanitisedEmote[],
  signal?: AbortSignal,
  priority: CacheImageOptions['priority'] = 'interactive',
): Promise<void> => {
  if (emotes.length === 0 || signal?.aborted) {
    return;
  }

  const urls = emotes.map(e => e.url).filter(Boolean);
  const urlsToCache = urls.filter(url => {
    if (url.startsWith('data:') || url.startsWith('file://')) {
      return false;
    }
    return !getCachedImageUri(url);
  });

  if (urlsToCache.length === 0) {
    return;
  }

  warmImageCache(urlsToCache, { priority, signal, variant: 'emote' });
};

export const clearEmoteImageCache = (): void => {
  emoteImageCachePromises.clear();
  clearSessionCache();
};
