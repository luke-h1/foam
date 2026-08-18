import { storageService } from '@app/lib/storage';

// Bumped from `user-id:`: older entries have no emoteSetId and would read back
// as a user with no active set.
const SEVEN_TV_USER_CACHE_PREFIX = 'user:v2:';
// Keep persisted 7TV user lookups for at most 12 hours before resolving again.
const SEVEN_TV_USER_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const SEVEN_TV_USER_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
/**
 * Matches the channel cache's CACHE_DURATION, so an emote set switch made while
 * the user was away surfaces on the same schedule the rest of the channel does.
 */
export const SEVEN_TV_EMOTE_SET_MAX_AGE_MS = 60 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';
const MAX_RESOLVED_USER_ENTRIES = 2000;

/**
 * Empty `userId` means no 7TV account; empty `emoteSetId` means no active set.
 */
export type SevenTvUser = {
  userId: string;
  emoteSetId: string;
};

export type CachedSevenTvUser = SevenTvUser & {
  fetchedAt: number;
  expiresAt: number;
};

export type SevenTvUserCacheStorage = {
  getString: <T>(key: string, namespacePrefix?: 'seven_tv_cache') => T | null;
  set: (
    key: string,
    value: CachedSevenTvUser,
    namespacePrefix?: 'seven_tv_cache',
    options?: { expiry?: Date },
  ) => void;
  delete: (key: string, namespacePrefix?: 'seven_tv_cache') => void;
  clearNamespace: (
    namespacePrefix: 'seven_tv_cache',
    keyPrefix?: string,
  ) => void;
};

/**
 * `null` means the lookup failed and must not be cached, as distinct from a
 * user that resolved to empty ids.
 */
export type SevenTvUserFetcher = (
  twitchUserId: string,
) => Promise<SevenTvUser | null>;

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

  const sevenTvUserRequests = new Map<string, Promise<SevenTvUser | null>>();

  // Bumped by clear() so in-flight requests cannot write back stale results.
  let cacheGeneration = 0;

  // Positive resolutions only, so the negative TTL still lets a new account
  // resolve. Expiry tracked here too: user ids never change, emote sets do.
  const resolvedSevenTvUsers = new Map<string, CachedSevenTvUser>();

  function rememberResolvedSevenTvUser(
    twitchUserId: string,
    user: CachedSevenTvUser,
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

  function getCachedSevenTvUser(
    twitchUserId: string,
  ): CachedSevenTvUser | undefined {
    return (
      storage.getString<CachedSevenTvUser>(
        getSevenTvUserStorageKey(twitchUserId),
        SEVEN_TV_CACHE_NAMESPACE,
      ) ?? undefined
    );
  }

  function cacheSevenTvUser(
    twitchUserId: string,
    user: SevenTvUser,
  ): CachedSevenTvUser {
    const fetchedAt = Date.now();
    const cached: CachedSevenTvUser = {
      fetchedAt,
      expiresAt:
        fetchedAt +
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

    return cached;
  }

  const toSevenTvUser = ({
    userId,
    emoteSetId,
  }: CachedSevenTvUser): SevenTvUser => ({ userId, emoteSetId });

  return {
    /**
     * Resolves to `null` when the lookup failed and nothing was cached, so
     * callers can tell that apart from a user that resolved to empty ids.
     *
     * `maxAgeMs` lets a caller demand a fresher entry than the 12h TTL: a
     * user id never changes, but the active emote set does.
     */
    async resolve(
      twitchUserId: string,
      fetchSevenTvUser: SevenTvUserFetcher,
      { maxAgeMs = Infinity }: { maxAgeMs?: number } = {},
    ): Promise<SevenTvUser | null> {
      const now = Date.now();
      const isFresh = (user: CachedSevenTvUser) =>
        user.expiresAt > now && now - user.fetchedAt <= maxAgeMs;

      const resolved = resolvedSevenTvUsers.get(twitchUserId);
      if (resolved !== undefined) {
        if (isFresh(resolved)) {
          return toSevenTvUser(resolved);
        }
        resolvedSevenTvUsers.delete(twitchUserId);
      }

      const cached = getCachedSevenTvUser(twitchUserId);
      if (cached !== undefined && isFresh(cached)) {
        rememberResolvedSevenTvUser(twitchUserId, cached);
        return toSevenTvUser(cached);
      }

      const pending = sevenTvUserRequests.get(twitchUserId);
      if (pending) {
        return pending;
      }

      const requestGeneration = cacheGeneration;
      const request = (async () => {
        const fetched = await fetchSevenTvUser(twitchUserId);
        if (fetched === null) {
          return null;
        }
        if (cacheGeneration === requestGeneration) {
          rememberResolvedSevenTvUser(
            twitchUserId,
            cacheSevenTvUser(twitchUserId, fetched),
          );
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

    /**
     * Drops one user, for when something else already knows the record is
     * stale - the EventAPI reporting that a channel switched emote set.
     */
    invalidate(twitchUserId: string): void {
      resolvedSevenTvUsers.delete(twitchUserId);
      storage.delete(
        getSevenTvUserStorageKey(twitchUserId),
        SEVEN_TV_CACHE_NAMESPACE,
      );
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
