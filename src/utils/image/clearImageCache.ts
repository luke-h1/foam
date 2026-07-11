// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

import { clearPaintBitmapCache } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintBitmapCacheLifecycle';
import { clearCachedEmoteRefs } from '@app/Providers/CachedEmotesProvider/cache-service';

export const clearImageCache = async () => {
  // Drop JS ImageRefs before native bitmaps — clearing only native leaves
  // dangling refs that crash on the next emote render.
  clearCachedEmoteRefs();
  clearPaintBitmapCache();
  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
