import { storageService } from '@app/lib/storage';

const SEVEN_TV_USER_ID_CACHE_PREFIX = 'user-id:';
// Keep persisted 7TV user ID lookups for at most 12 hours before resolving again.
const SEVEN_TV_USER_ID_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const SEVEN_TV_USER_ID_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';
const MAX_RESOLVED_USER_ID_ENTRIES = 2000;

type CachedSevenTvUserId = {
  expiresAt: number;
  userId: string;
};

export type SevenTvUserIdCacheStorage = {
  getString: <T>(key: string, namespacePrefix?: 'seven_tv_cache') => T | null;
  set: (
    key: string,
    value: unknown,
    namespacePrefix?: 'seven_tv_cache',
    options?: { expiry?: Date },
  ) => void;
  clearNamespace: (
    namespacePrefix: 'seven_tv_cache',
    keyPrefix?: string,
  ) => void;
};

/**
 * Fetches the 7TV user ID for a Twitch user ID. Resolves to the 7TV user ID,
 * an empty string when the user has no 7TV account, or `null` when the lookup
 * failed and the result must not be cached.
 */
export type SevenTvUserIdFetcher = (
  twitchUserId: string,
) => Promise<string | null>;

/**
 * Twitch to 7TV user-id resolution cache: bounded in-memory map, MMKV
 * persistence with positive/negative TTLs, and in-flight request dedup.
 */
export function createSevenTvUserIdCache(
  storage: SevenTvUserIdCacheStorage,
  options: { maxResolvedEntries?: number } = {},
) {
  const maxResolvedEntries =
    options.maxResolvedEntries ?? MAX_RESOLVED_USER_ID_ENTRIES;

  const sevenTvUserIdRequests = new Map<string, Promise<string>>();

  // Bumped by clear() so in-flight requests cannot write back stale results.
  let cacheGeneration = 0;

  // Positive resolutions only, so the MMKV negative TTL still lets a
  // newly-created 7TV account resolve.
  const resolvedSevenTvUserIds = new Map<string, string>();

  function rememberResolvedSevenTvUserId(
    twitchUserId: string,
    userId: string,
  ): void {
    if (!userId) {
      return;
    }
    if (resolvedSevenTvUserIds.has(twitchUserId)) {
      resolvedSevenTvUserIds.delete(twitchUserId);
    } else if (resolvedSevenTvUserIds.size >= maxResolvedEntries) {
      const oldest = resolvedSevenTvUserIds.keys().next().value;
      if (oldest !== undefined) {
        resolvedSevenTvUserIds.delete(oldest);
      }
    }
    resolvedSevenTvUserIds.set(twitchUserId, userId);
  }

  const getSevenTvUserIdStorageKey = (twitchUserId: string) =>
    `sevenTvUserId_${SEVEN_TV_USER_ID_CACHE_PREFIX}${twitchUserId}` as const;

  function getCachedSevenTvUserId(twitchUserId: string): string | undefined {
    const cached = storage.getString<CachedSevenTvUserId>(
      getSevenTvUserIdStorageKey(twitchUserId),
      SEVEN_TV_CACHE_NAMESPACE,
    );
    if (!cached) {
      return undefined;
    }
    return cached.userId;
  }

  function cacheSevenTvUserId(twitchUserId: string, userId: string) {
    const cached: CachedSevenTvUserId = {
      expiresAt:
        Date.now() +
        (userId
          ? SEVEN_TV_USER_ID_CACHE_TTL_MS
          : SEVEN_TV_USER_ID_NEGATIVE_CACHE_TTL_MS),
      userId,
    };

    storage.set(
      getSevenTvUserIdStorageKey(twitchUserId),
      cached,
      SEVEN_TV_CACHE_NAMESPACE,
      { expiry: new Date(cached.expiresAt) },
    );
  }

  return {
    async resolve(
      twitchUserId: string,
      fetchSevenTvUserId: SevenTvUserIdFetcher,
    ): Promise<string> {
      const resolved = resolvedSevenTvUserIds.get(twitchUserId);
      if (resolved !== undefined) {
        return resolved;
      }

      const cached = getCachedSevenTvUserId(twitchUserId);
      if (cached !== undefined) {
        rememberResolvedSevenTvUserId(twitchUserId, cached);
        return cached;
      }

      const pending = sevenTvUserIdRequests.get(twitchUserId);
      if (pending) {
        return pending;
      }

      const requestGeneration = cacheGeneration;
      const request = (async () => {
        const fetched = await fetchSevenTvUserId(twitchUserId);
        if (fetched === null) {
          return '';
        }
        if (cacheGeneration === requestGeneration) {
          cacheSevenTvUserId(twitchUserId, fetched);
          rememberResolvedSevenTvUserId(twitchUserId, fetched);
        }
        return fetched;
      })();

      sevenTvUserIdRequests.set(twitchUserId, request);
      try {
        return await request;
      } finally {
        sevenTvUserIdRequests.delete(twitchUserId);
      }
    },

    clear(): void {
      cacheGeneration += 1;
      sevenTvUserIdRequests.clear();
      resolvedSevenTvUserIds.clear();
      storage.clearNamespace(SEVEN_TV_CACHE_NAMESPACE, 'sevenTvUserId_');
    },
  };
}

export const sevenTvUserIdCache = createSevenTvUserIdCache(storageService);
