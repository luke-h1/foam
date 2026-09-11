import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import type { ChannelCacheType } from '../types/constants';
import { MAX_CACHED_CHANNELS } from '../types/constants';

// One MMKV key per channel: the shared `chat-store-v2` blob reached 20 MB and
// was parsed whole on first chat open. Native only - the `.web.ts` sibling
// keeps the Legend State blob.
export const CHANNEL_CACHE_PERSISTENCE_ENABLED = true;

const caches = createMMKV({ id: 'chat-channel-caches' });
// `lastUpdated` per channel, kept apart so pruning never parses a cache.
const index = createMMKV({ id: 'chat-channel-cache-index' });

const pendingWrites = new Map<string, ChannelCacheType | undefined>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let hydrating = false;

export const readPersistedChannelCache = (
  channelId: string,
): ChannelCacheType | undefined => {
  // A queued write is the newer truth until it flushes; without this a
  // channel cleared and reopened inside the coalescing window would come back.
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

const flush = (): void => {
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

// Coalesced for 250ms and flushed on background, like the Legend State patch.
export const queuePersistedChannelCacheWrite = (
  channelId: string,
  cache: ChannelCacheType | undefined,
): void => {
  pendingWrites.set(channelId, cache);
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 250);
  }
};

/**
 * Returns the dropped ids so the caller drops them from memory too.
 */
export const prunePersistedChannelCaches = (
  currentChannelId: string,
): string[] => {
  // Index and blob land together in flush, so count after flushing.
  flush();
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

/**
 * Not migrated: every slice has a one hour TTL, and migrating would parse the
 * 20 MB blob this module exists to avoid.
 */
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
    flush();
  }
});
