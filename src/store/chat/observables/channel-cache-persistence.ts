import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import { MAX_CACHED_CHANNELS } from '../types/cache-limits';
import type { ChannelCacheType } from '../types/constants';

export const CHANNEL_CACHE_PERSISTENCE_ENABLED = true;

const caches = createMMKV({ id: 'chat-channel-caches' });

const index = createMMKV({ id: 'chat-channel-cache-index' });

const pendingWrites = new Map<string, ChannelCacheType | undefined>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let hydrating = false;

export const readPersistedChannelCache = (
  channelId: string,
): ChannelCacheType | undefined => {
  if (pendingWrites.has(channelId)) {
    return pendingWrites.get(channelId);
  }

  const raw = caches.getString(channelId);

  if (!raw) {
    return undefined;
  }

  try {
    // SAFETY: every value in this instance is written by `flush` as the JSON of a ChannelCacheType; a malformed blob is dropped by the catch.
    return JSON.parse(raw) as ChannelCacheType;
  } catch {
    caches.remove(channelId);
    index.remove(channelId);
    return undefined;
  }
};

export const flushPersistedChannelCacheWrites = (): void => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  for (const [channelId, cache] of pendingWrites) {
    if (cache) {
      caches.set(channelId, JSON.stringify(cache));
      index.set(channelId, cache.lastUpdated || 0);
    } else {
      caches.remove(channelId);
      index.remove(channelId);
    }
  }

  pendingWrites.clear();
};

export const queuePersistedChannelCacheWrite = (
  channelId: string,
  cache: ChannelCacheType | undefined,
): void => {
  pendingWrites.set(channelId, cache);
  if (!flushTimer) {
    flushTimer = setTimeout(flushPersistedChannelCacheWrites, 250);
  }
};

export const prunePersistedChannelCaches = (
  currentChannelId: string,
): string[] => {
  flushPersistedChannelCacheWrites();

  const ids = index.getAllKeys();

  if (ids.length <= MAX_CACHED_CHANNELS) {
    return [];
  }

  const dropped = ids
    .filter(id => id !== currentChannelId)
    .sort((a, b) => (index.getNumber(a) ?? 0) - (index.getNumber(b) ?? 0))
    .slice(0, ids.length - MAX_CACHED_CHANNELS);

  for (const id of dropped) {
    pendingWrites.delete(id);
    caches.remove(id);
    index.remove(id);
  }

  return dropped;
};

export const clearPersistedChannelCaches = (): void => {
  pendingWrites.clear();

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  caches.clearAll();
  index.clearAll();
};

/**
 * The write-through listener skips writes made inside this.
 */
export const runChannelCacheHydration = (write: () => void): void => {
  hydrating = true;
  try {
    write();
  } finally {
    hydrating = false;
  }
};

export const isHydratingChannelCache = (): boolean => hydrating;

export const removeLegacyChatStoreBlob = (key: string): void => {
  try {
    const legacy = createMMKV({ id: 'obsPersist' });
    if (legacy.contains(key)) {
      legacy.remove(key);
      legacy.remove(`${key}__m`);
    }
  } catch {
    // A failed cleanup only leaves a stale key behind.
  }
};

AppState.addEventListener('change', status => {
  if (status !== 'active') {
    flushPersistedChannelCacheWrites();
  }
});
