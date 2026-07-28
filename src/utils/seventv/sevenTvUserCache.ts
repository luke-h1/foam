import { storageService } from '@app/lib/storage';

// Bumped from `user-id:` when the record grew an emote set id, so entries
// written by an older build are ignored rather than read back as a user with
// no active emote set.
const SEVEN_TV_USER_CACHE_PREFIX = 'user:v2:';
// Keep persisted 7TV user lookups for at most 12 hours before resolving again.
const SEVEN_TV_USER_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const SEVEN_TV_USER_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';
const MAX_RESOLVED_USER_ENTRIES = 2000;

/**
 * The 7TV user behind a Twitch user id. Both fields are empty when the user has
 * no 7TV account; `emoteSetId` alone is empty when the account exists but has
 * no active emote set.
 */
export type SevenTvUser = {
  userId: string;
  emoteSetId: string;
};

type CachedSevenTvUser = SevenTvUser & {
  expiresAt: number;
};

export type SevenTvUserCacheStorage = {
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
 * Fetches the 7TV user for a Twitch user ID. Resolves to the user, to a record
 * of empty strings when the user has no 7TV account, or to `null` when the
 * lookup failed and the result must not be cached.
 */
export type SevenTvUserFetcher = (
  twitchUserId: string,
) => Promise<SevenTvUser | null>;

export const NO_SEVEN_TV_USER: SevenTvUser = { userId: '', emoteSetId: '' };

/**
 * Twitch to 7TV user resolution cache: bounded in-memory map, MMKV persistence
 * with positive/negative TTLs, and in-flight request dedup.
 */
export function createSevenTvUserCache(
  storage: SevenTvUserCacheStorage,
  options: { maxResolvedEntries?: number } = {},
) {
  const maxResolvedEntries =
    options.maxResolvedEntries ?? MAX_RESOLVED_USER_ENTRIES;

  const sevenTvUserRequests = new Map<string, Promise<SevenTvUser>>();

  // Bumped by clear() so in-flight requests cannot write back stale results.
  let cacheGeneration = 0;

  // Positive resolutions only, so the MMKV negative TTL still lets a
  // newly-created 7TV account resolve.
  const resolvedSevenTvUsers = new Map<string, SevenTvUser>();

  function rememberResolvedSevenTvUser(
    twitchUserId: string,
    user: SevenTvUser,
  ): void {
    if (!user.userId) {
      return;
    }
    if (resolvedSevenTvUsers.has(twitchUserId)) {
      resolvedSevenTvUsers.delete(twitchUserId);
    } else if (resolvedSevenTvUsers.size >= maxResolvedEntries) {
      const oldest = resolvedSevenTvUsers.keys().next().value;
      if (oldest !== undefined) {
        resolvedSevenTvUsers.delete(oldest);
      }
    }
    resolvedSevenTvUsers.set(twitchUserId, user);
  }

  const getSevenTvUserStorageKey = (twitchUserId: string) =>
    `sevenTvUserId_${SEVEN_TV_USER_CACHE_PREFIX}${twitchUserId}` as const;

  function getCachedSevenTvUser(twitchUserId: string): SevenTvUser | undefined {
    const cached = storage.getString<CachedSevenTvUser>(
      getSevenTvUserStorageKey(twitchUserId),
      SEVEN_TV_CACHE_NAMESPACE,
    );
    if (!cached) {
      return undefined;
    }
    return { userId: cached.userId, emoteSetId: cached.emoteSetId };
  }

  function cacheSevenTvUser(twitchUserId: string, user: SevenTvUser) {
    const cached: CachedSevenTvUser = {
      expiresAt:
        Date.now() +
        (user.userId
          ? SEVEN_TV_USER_CACHE_TTL_MS
          : SEVEN_TV_USER_NEGATIVE_CACHE_TTL_MS),
      userId: user.userId,
      emoteSetId: user.emoteSetId,
    };

    storage.set(
      getSevenTvUserStorageKey(twitchUserId),
      cached,
      SEVEN_TV_CACHE_NAMESPACE,
      { expiry: new Date(cached.expiresAt) },
    );
  }

  return {
    async resolve(
      twitchUserId: string,
      fetchSevenTvUser: SevenTvUserFetcher,
    ): Promise<SevenTvUser> {
      const resolved = resolvedSevenTvUsers.get(twitchUserId);
      if (resolved !== undefined) {
        return resolved;
      }

      const cached = getCachedSevenTvUser(twitchUserId);
      if (cached !== undefined) {
        rememberResolvedSevenTvUser(twitchUserId, cached);
        return cached;
      }

      const pending = sevenTvUserRequests.get(twitchUserId);
      if (pending) {
        return pending;
      }

      const requestGeneration = cacheGeneration;
      const request = (async () => {
        const fetched = await fetchSevenTvUser(twitchUserId);
        if (fetched === null) {
          return NO_SEVEN_TV_USER;
        }
        if (cacheGeneration === requestGeneration) {
          cacheSevenTvUser(twitchUserId, fetched);
          rememberResolvedSevenTvUser(twitchUserId, fetched);
        }
        return fetched;
      })();

      sevenTvUserRequests.set(twitchUserId, request);
      try {
        return await request;
      } finally {
        if (sevenTvUserRequests.get(twitchUserId) === request) {
          sevenTvUserRequests.delete(twitchUserId);
        }
      }
    },

    clear(): void {
      cacheGeneration += 1;
      sevenTvUserRequests.clear();
      resolvedSevenTvUsers.clear();
      storage.clearNamespace(SEVEN_TV_CACHE_NAMESPACE, 'sevenTvUserId_');
    },
  };
}

export const sevenTvUserCache = createSevenTvUserCache(storageService);
