import { Image } from 'expo-image';

import { clearCachedEmoteRefs } from '@app/lib/emote-cache/cacheService';
import { clearSessionCache } from '@app/utils/image/imageCache';
import { clearPaintBitmapCache } from '@app/utils/image/paintBitmapCacheLifecycle';

/**
 * The one clear that covers all four image caches; clearing a subset leaves
 * stale records serving purged images.
 */
export const clearImageCache = async () => {
  // Drop JS ImageRefs before native bitmaps - clearing only native leaves
  // dangling refs that crash on the next emote render.
  clearCachedEmoteRefs();

  clearPaintBitmapCache();
  clearSessionCache();
  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
