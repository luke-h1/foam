import { logger } from '@app/utils/logger';
import { observable } from '@legendapp/state';
import {
  cacheImageFromUrl,
  getCachedImageUri,
  type CacheImageOptions,
} from './image-cache';

/**
 *  LOG  21:51:40 |  chat  | WARN : ❌ Failed to cache emote image https://cdn.7tv.app/emote/01GQFT1WF80002Q9KS8SKQMH...: “CFNetworkDownload_MmQVXk.tmp” couldn’t be moved to “chat-img-cache” because either the former doesn’t exist, or the folder containing the latter doesn’t exist.
 */

// Cache for compressed emote URLs (original URL -> cached file URI) using Legend State
const compressionCache$ = observable<Record<string, string>>({});
const compressionPromises = new Map<string, Promise<string>>();

/**
 * Cache an emote image URL to disk on-demand
 * Uses Legend State for reactive caching to avoid re-caching the same URL
 * Returns the original URL immediately, then updates to cached file URI when ready
 */
export async function compressEmoteUrl(
  url: string,
  options: CacheImageOptions = {},
): Promise<string> {
  // If already a file URI or data URI, return as-is
  if (!url || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }

  // Check in-memory cache first (fastest) - no logging in hot path
  const cached = compressionCache$.peek()[url];
  if (cached) {
    return cached;
  }

  // Check if file already exists on disk (before downloading)
  const existingFileUri = getCachedImageUri(url, { variant: 'emote' });
  if (existingFileUri) {
    // Update in-memory cache for future lookups
    const currentCache = compressionCache$.peek();
    compressionCache$.set({ ...currentCache, [url]: existingFileUri });
    return existingFileUri;
  }

  // Check if compression is already in progress
  const inProgress = compressionPromises.get(url);
  if (inProgress) {
    return inProgress;
  }

  // Start caching to disk
  logger.chat.debug(
    `🔄 Starting disk cache for emote: ${url.substring(0, 50)}...`,
  );
  const compressionPromise = (async () => {
    try {
      // Cache image to disk using image-cache utility
      const fileUri = await cacheImageFromUrl(url, {
        priority: options.priority ?? 'visible',
        signal: options.signal,
        variant: 'emote',
      });

      logger.chat.info(
        `✅ Cached emote to disk: ${url.substring(0, 50)}... → ${fileUri.substring(0, 50)}...`,
      );

      // Cache the result using Legend State
      const currentCache = compressionCache$.peek();
      compressionCache$.set({ ...currentCache, [url]: fileUri });
      compressionPromises.delete(url);

      return fileUri;
    } catch (error) {
      // On error, remove from in-progress and return original URL
      compressionPromises.delete(url);
      logger.chat.warn(
        `❌ Failed to cache emote image ${url.substring(0, 50)}...:`,
        error,
      );
      return url; // Fallback to original URL
    }
  })();

  compressionPromises.set(url, compressionPromise);
  return compressionPromise;
}

/**
 * Get cached file URI synchronously if available, otherwise return original URL
 * Use this for immediate rendering, then call compressEmoteUrl for async caching
 */
export function getCompressedEmoteUrl(url: string): string {
  // Hot path - no logging to avoid flooding console during high-volume chat
  if (!url || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }
  const cached = compressionCache$.peek()[url];
  if (cached) {
    return cached;
  }
  const existingFileUri = getCachedImageUri(url, { variant: 'emote' });
  if (existingFileUri) {
    const currentCache = compressionCache$.peek();
    compressionCache$.set({ ...currentCache, [url]: existingFileUri });
    return existingFileUri;
  }
  return url;
}
