import type { ChannelCacheType } from '../types/constants';

// Web keeps the Legend State IndexedDB row for the whole `persisted` slice
// (see chatStore.ts), so these are no-ops.
export const CHANNEL_CACHE_PERSISTENCE_ENABLED = false;

export const readPersistedChannelCache = (
  _channelId: string,
): ChannelCacheType | undefined => undefined;

export const queuePersistedChannelCacheWrite = (
  _channelId: string,
  _cache: ChannelCacheType | undefined,
): void => {};

export const prunePersistedChannelCaches = (
  _currentChannelId: string,
): string[] => [];

export const clearPersistedChannelCaches = (): void => {};

export const runChannelCacheHydration = (write: () => void): void => {
  write();
};

export const isHydratingChannelCache = (): boolean => false;

export const removeLegacyChatStoreBlob = (_key: string): void => {};
