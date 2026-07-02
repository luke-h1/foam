// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

import { clearCachedEmoteRefs } from '@app/Providers/CachedEmotesProvider/cache-service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const clearImageCache = async (_channelId?: string) => {
  // Invalidate the JS-side decoded ImageRef map (and notify mounted rows to fall
  // back to the url) BEFORE freeing the native bitmaps those refs point at.
  // Clearing only the native cache leaves dangling refs that hard-crash on the
  // next emote render.
  clearCachedEmoteRefs();
  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
