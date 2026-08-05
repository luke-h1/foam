// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

import { clearCachedEmoteRefs } from '@app/Providers/CachedEmotesProvider/cache-service';
import { clearPaintBitmapCache } from '@app/utils/image/paintBitmapCacheLifecycle';

export const clearImageCache = async () => {
  // Drop JS ImageRefs before native bitmaps — clearing only native leaves
  // dangling refs that crash on the next emote render.
  clearCachedEmoteRefs();
  clearPaintBitmapCache();
  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
