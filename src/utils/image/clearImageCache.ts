import { useChatStore } from '@app/store';
// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';

export const clearImageCache = async (channelId?: string) => {
  const { clearCache } = useChatStore.getState();
  clearCache(channelId);

  await Image.clearDiskCache();
  void Image.clearMemoryCache();
};
