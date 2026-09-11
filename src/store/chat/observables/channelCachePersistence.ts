import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import type { ChannelCacheType } from '../types/constants';
import { MAX_CACHED_CHANNELS } from '../types/constants';

// One MMKV key per channel so opening a chat parses only that channel's cache;
// the shared `chat-store-v2` blob held every channel (20 MB on a 14-channel
// install) and was parsed on first chat open and re-serialised per save.
// Native only - the `.web.ts` sibling keeps the Legend State blob.
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
    } else {
      caches.remove(channelId);
      index.remove(channelId);
    }
  }
  pendingWrites.clear();
};

// Writes coalesce for 250ms (a channel load assigns several slices in a row)
// and flush when the app leaves the foreground, like the Legend State patch.
export const queuePersistedChannelCacheWrite = (
  channelId: string,
  cache: ChannelCacheType | undefined,
): void => {
  pendingWrites.set(channelId, cache);
  if (cache) {
    index.set(channelId, cache.lastUpdated || 0);
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 250);
  }
};

/**
 * Drops the least recently updated channels beyond MAX_CACHED_CHANNELS from
 * disk and returns their ids so the caller drops them from memory too.
 */
export const prunePersistedChannelCaches = (
  currentChannelId: string,
): string[] => {
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
 * Runs a store write that mirrors disk, so the write-through listener skips
 * it instead of re-serialising what was just read.
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
 * Removes the whole-store blob older builds wrote into the shared `obsPersist`
 * instance. Its channel caches are not migrated: every slice has a one hour
 * TTL, so the next chat open refetches at most what it would have refreshed
 * anyway, and migrating would parse the 20 MB blob this change exists to avoid.
 */
export const removeLegacyChatStoreBlob = (key: string): void => {
  try {
    const legacy = createMMKV({ id: 'obsPersist' });
    if (legacy.contains(key)) {
      legacy.remove(key);
      legacy.remove(`${key}__m`);
    }
  } catch {
    // Best-effort; a failed cleanup just leaves a stale key behind.
  }
};

AppState.addEventListener('change', status => {
  if (status !== 'active') {
    flush();
  }
});
