// import { useChatStore } from '@app/store';
// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const clearImageCache = async (_channelId?: string) => {
  // clearCache(channelId);

  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
