import {
  CHANNEL_CACHE_PERSISTENCE_ENABLED,
  readPersistedChannelCache,
  runChannelCacheHydration,
} from '../observables/channelCachePersistence';
import { chatStore$ } from '../observables/chatStore';

/**
 * In-memory data wins over disk.
 */
export const ensureChannelCacheHydrated = (channelId: string): void => {
  if (!CHANNEL_CACHE_PERSISTENCE_ENABLED) {
    return;
  }
  if (chatStore$.persisted.channelCaches[channelId]?.peek()) {
    return;
  }
  const persisted = readPersistedChannelCache(channelId);
  if (!persisted) {
    return;
  }
  runChannelCacheHydration(() => {
    chatStore$.persisted.channelCaches.assign({ [channelId]: persisted });
  });
};
