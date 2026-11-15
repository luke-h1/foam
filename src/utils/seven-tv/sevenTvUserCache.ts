import { SEVEN_TV_CACHE_NAMESPACE, storageService } from '@app/lib/storage';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';

const SEVEN_TV_USER_CACHE_PREFIX = 'user:v2:';

const SEVEN_TV_USER_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const SEVEN_TV_USER_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;

export const SEVEN_TV_EMOTE_SET_MAX_AGE_MS = 60 * 60 * 1000;

const SEVEN_TV_USER_STORAGE_KEY_PREFIX = 'sevenTvUserId_';

const MAX_RESOLVED_USER_ENTRIES = 2000;

/**
 * Empty `userId` means no 7TV account; empty `emoteSetId` means no active set.
 */
export interface SevenTvUser {
  userId: string;
  emoteSetId: string;
}

export interface CachedSevenTvUser extends SevenTvUser {
  fetchedAt: number;
  expiresAt: number;
}

type SevenTvCacheNamespace = typeof SEVEN_TV_CACHE_NAMESPACE;

export interface SevenTvUserCacheStorage {
  getString: <T>(
    key: string,
    namespacePrefix?: SevenTvCacheNamespace,
  ) => T | null;
  set: (
    key: string,
    value: CachedSevenTvUser,
    namespacePrefix?: SevenTvCacheNamespace,
    options?: { expiry?: Date },
  ) => void;
  delete: (key: string, namespacePrefix?: SevenTvCacheNamespace) => void;
  clearNamespace: (
    namespacePrefix: SevenTvCacheNamespace,
    keyPrefix?: string,
  ) => void;
}

/**
 * `null` means the lookup failed and must not be cached, as distinct from a
 * user that resolved to empty ids.
 */
export type SevenTvUserFetcher = (
  twitchUserId: string,
) => Promise<SevenTvUser | null>;

export function createSevenTvUserCache(
  storage: SevenTvUserCacheStorage,
  options: { maxResolvedEntries?: number } = {},
) {
  const maxResolvedEntries =
    options.maxResolvedEntries ?? MAX_RESOLVED_USER_ENTRIES;

  const requestGuard = createFetchOnceGuard();

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
    } else {
      evictOldestWhenFull(resolvedSevenTvUsers, maxResolvedEntries);
    }

    resolvedSevenTvUsers.set(twitchUserId, user);
  }

  const getSevenTvUserStorageKey = (twitchUserId: string) =>
    `${SEVEN_TV_USER_STORAGE_KEY_PREFIX}${SEVEN_TV_USER_CACHE_PREFIX}${twitchUserId}` as const;

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
     * `null` means the lookup failed with nothing cached, distinct from empty
     * ids; `maxAgeMs` demands a fresher entry than the 12h TTL.
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

      if (resolved !== undefined && isFresh(resolved)) {
        return toSevenTvUser(resolved);
      }

      if (resolved !== undefined) {
        resolvedSevenTvUsers.delete(twitchUserId);
      }

      const cached = getCachedSevenTvUser(twitchUserId);

      if (cached !== undefined && isFresh(cached)) {
        rememberResolvedSevenTvUser(twitchUserId, cached);
        return toSevenTvUser(cached);
      }

      return requestGuard.run(twitchUserId, async ctx => {
        const fetched = await fetchSevenTvUser(twitchUserId);

        if (fetched === null) {
          return null;
        }

        if (ctx.stillCurrent()) {
          rememberResolvedSevenTvUser(
            twitchUserId,
            cacheSevenTvUser(twitchUserId, fetched),
          );
        }

        return fetched;
      });
    },

    invalidate(twitchUserId: string): void {
      resolvedSevenTvUsers.delete(twitchUserId);
      storage.delete(
        getSevenTvUserStorageKey(twitchUserId),
        SEVEN_TV_CACHE_NAMESPACE,
      );
    },

    clear(): void {
      requestGuard.clear();
      resolvedSevenTvUsers.clear();
      storage.clearNamespace(
        SEVEN_TV_CACHE_NAMESPACE,
        SEVEN_TV_USER_STORAGE_KEY_PREFIX,
      );
    },
  };
}

export const sevenTvUserCache = createSevenTvUserCache(storageService);
