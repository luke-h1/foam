// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

import { clearCachedEmoteRefs } from '@app/Providers/CachedEmotesProvider/cache-service';
import { clearSessionCache } from '@app/utils/image/image-cache';
import { clearPaintBitmapCache } from '@app/utils/image/paintBitmapCacheLifecycle';

/**
 * The one clear that covers all four image caches: decoded emote refs, the
 * MMKV-manifested file cache, Skia paint bitmaps, and expo-image's own
 * memory/disk caches. Clearing a subset leaves stale records serving - a
 * wiped expo-image cache with a live file-cache manifest keeps resolving
 * file:// uris for images the user asked to purge.
 */
export const clearImageCache = async () => {
  // Drop JS ImageRefs before native bitmaps — clearing only native leaves
  // dangling refs that crash on the next emote render.
  clearCachedEmoteRefs();
  clearPaintBitmapCache();
  clearSessionCache();
  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
