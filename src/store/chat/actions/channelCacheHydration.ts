import {
  CHANNEL_CACHE_PERSISTENCE_ENABLED,
  readPersistedChannelCache,
  runChannelCacheHydration,
} from '../observables/channelCachePersistence';
import { chatStore$ } from '../observables/chatStore';

/**
 * Loads one channel's persisted cache into the store the first time that
 * channel is opened this session. In-memory data wins.
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
