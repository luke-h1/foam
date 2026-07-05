import { batch } from '@legendapp/state';

import {
  buildSevenTvBadgeImageUrl,
  normalizeSevenTvBadge,
} from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import { storageService } from '@app/lib/storage';
import {
  clearSevenTvUserIdCache,
  sevenTvService,
} from '@app/services/seventv-service';
import type { PaintData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import {
  convertV4PaintToPaintData,
  type V4Badge,
} from '@app/utils/color/sevenTvPaintData';
import { logger } from '@app/utils/logger';

import { chatStore$ } from '../observables/chatStore';
import { writePersistedCosmetics } from '../observables/cosmeticsPersistence';
import { MAX_COSMETIC_ENTRIES } from '../types/constants';
import {
  clearAllMissingBadges,
  clearMissingBadge,
  reportMissingBadge,
} from './missingBadges';

export { getMissingBadgeIds, hasMissingBadges } from './missingBadges';

const COSMETICS_PERSIST_DEBOUNCE_MS = 4000;
let cosmeticsPersistTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced MMKV snapshot of the cosmetic maps. Cosmetics arrive in a burst as
 * a channel loads; coalescing into one write per quiet window keeps this off
 * the hot path and avoids repeated whole-map serialization.
 */
export const scheduleCosmeticsPersist = (): void => {
  if (cosmeticsPersistTimer) {
    return;
  }
  cosmeticsPersistTimer = setTimeout(() => {
    cosmeticsPersistTimer = null;
    writePersistedCosmetics({
      paints: chatStore$.paints.peek(),
      badges: chatStore$.badges.peek(),
      userPaintIds: chatStore$.userPaintIds.peek(),
      userBadgeIds: chatStore$.userBadgeIds.peek(),
    });
  }, COSMETICS_PERSIST_DEBOUNCE_MS);
};

const USER_COSMETICS_CACHE_PREFIX = 'user-cosmetics:';
// Keep persisted 7TV user cosmetics for at most 12 hours before refetching.
const USER_COSMETICS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const USER_COSMETICS_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';

type CachedUserCosmetics = {
  badge?: SanitisedBadgeSet;
  badgeId: string | null;
  expiresAt: number;
  paint?: PaintData;
  paintId: string | null;
  ttvUserId: string | null;
};

const sessionCosmeticsCache = new Map<string, CachedUserCosmetics>();

// Bounded concurrency: entering a busy channel fires an entitlement.create
// burst (plus the visible-message hydrate path), each of which can call
// fetchAndCacheUserCosmetics; without a cap that stormed the network with
// hundreds of parallel getUserCosmeticsGql requests on channel entry.
const userCosmeticsFetchGuard = createFetchOnceGuard({ maxConcurrent: 4 });

const cacheSessionCosmetics = (
  sevenTvUserId: string,
  cosmetics: CachedUserCosmetics,
): void => {
  sessionCosmeticsCache.set(sevenTvUserId, cosmetics);
  if (sessionCosmeticsCache.size <= MAX_COSMETIC_ENTRIES) {
    return;
  }
  const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
  let removed = 0;
  for (const key of sessionCosmeticsCache.keys()) {
    if (removed >= trimCount) {
      break;
    }
    sessionCosmeticsCache.delete(key);
    removed += 1;
  }
};

const getUserCosmeticsStorageKey = (sevenTvUserId: string) =>
  `sevenTvUserCosmetics_${USER_COSMETICS_CACHE_PREFIX}${sevenTvUserId}` as const;

const convertV4BadgeToSanitised = (badge: V4Badge): SanitisedBadgeSet => {
  const bestImage =
    badge.images.find(img => img.scale === 4) ??
    badge.images.find(img => img.scale === 3) ??
    badge.images[0];

  return normalizeSevenTvBadge({
    id: badge.id,
    url: bestImage?.url ?? buildSevenTvBadgeImageUrl(badge.id),
    type: '7TV Badge',
    title: badge.description || badge.name,
    set: badge.id,
    provider: '7tv',
  });
};

function applyCachedUserCosmetics(cosmetics: CachedUserCosmetics) {
  batch(() => {
    if (cosmetics.paint) {
      addPaint(cosmetics.paint);
    }

    if (cosmetics.badge) {
      addBadge(cosmetics.badge);
    }

    if (cosmetics.ttvUserId) {
      if (cosmetics.paintId) {
        setUserPaint(cosmetics.ttvUserId, cosmetics.paintId);
      }

      if (cosmetics.badgeId) {
        setUserBadge(cosmetics.ttvUserId, cosmetics.badgeId);
      }
    }
  });
}

function getCachedUserCosmetics(
  sevenTvUserId: string,
): CachedUserCosmetics | undefined {
  const sessionCached = sessionCosmeticsCache.get(sevenTvUserId);
  if (sessionCached) {
    if (sessionCached.expiresAt > Date.now()) {
      return sessionCached;
    }
    sessionCosmeticsCache.delete(sevenTvUserId);
  }

  const stored =
    storageService.getString<CachedUserCosmetics>(
      getUserCosmeticsStorageKey(sevenTvUserId),
      SEVEN_TV_CACHE_NAMESPACE,
    ) ?? undefined;

  if (stored) {
    cacheSessionCosmetics(sevenTvUserId, stored);
  }

  return stored;
}

function setCachedUserCosmetics(
  sevenTvUserId: string,
  cosmetics: CachedUserCosmetics,
) {
  cacheSessionCosmetics(sevenTvUserId, cosmetics);
  storageService.set(
    getUserCosmeticsStorageKey(sevenTvUserId),
    cosmetics,
    SEVEN_TV_CACHE_NAMESPACE,
    { expiry: new Date(cosmetics.expiresAt) },
  );
}

export const fetchAndCacheUserCosmetics = async (
  sevenTvUserId: string,
): Promise<string | null> => {
  const cached = getCachedUserCosmetics(sevenTvUserId);
  if (cached) {
    applyCachedUserCosmetics(cached);
    return cached.ttvUserId;
  }

  return userCosmeticsFetchGuard.run(sevenTvUserId, async ctx => {
    try {
      const cosmetics = await sevenTvService.getUserCosmeticsGql(sevenTvUserId);
      if (!cosmetics) {
        return null;
      }

      const paint = cosmetics.paint
        ? convertV4PaintToPaintData(cosmetics.paint)
        : undefined;
      const badge = cosmetics.badge
        ? convertV4BadgeToSanitised(cosmetics.badge)
        : undefined;
      const cachedCosmetics: CachedUserCosmetics = {
        badge,
        badgeId: cosmetics.badgeId,
        expiresAt:
          Date.now() +
          (paint || badge
            ? USER_COSMETICS_CACHE_TTL_MS
            : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
        paint,
        paintId: cosmetics.paintId,
        ttvUserId: cosmetics.ttvUserId,
      };

      if (ctx.stillCurrent()) {
        setCachedUserCosmetics(sevenTvUserId, cachedCosmetics);
        applyCachedUserCosmetics(cachedCosmetics);
      }
      return cosmetics.ttvUserId;
    } catch (error) {
      logger.stvWs.error(
        `Error fetching cosmetics for user ${sevenTvUserId}:`,
        error,
      );
      return null;
    }
  });
};

export const clearUserCosmeticsCache = () => {
  userCosmeticsFetchGuard.clear();
  sessionCosmeticsCache.clear();
  clearSevenTvUserIdCache();
  storageService.clearNamespace(
    SEVEN_TV_CACHE_NAMESPACE,
    'sevenTvUserCosmetics_',
  );
  clearPaintsAndBadges();
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
};

export const setUserPaint = (ttvUserId: string, paintId: string): void => {
  const current = chatStore$.userPaintIds.peek();

  if (
    !(ttvUserId in current) &&
    Object.keys(current).length >= MAX_COSMETIC_ENTRIES
  ) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(current).slice(trimCount),
    );
    chatStore$.userPaintIds.set({ ...trimmed, [ttvUserId]: paintId });
  } else {
    chatStore$.userPaintIds[ttvUserId]?.set(paintId);
  }

  scheduleCosmeticsPersist();
};

export const addPaint = (paint: PaintData) => {
  if (paint.id) {
    const cell = chatStore$.paints[paint.id];
    cell?.set(paint);
    scheduleCosmeticsPersist();
  }
};

export const getPaint = (paintId: string): PaintData | undefined =>
  chatStore$.paints[paintId]?.peek();

const getUserPaintId = (ttvUserId: string): string | undefined =>
  chatStore$.userPaintIds[ttvUserId]?.peek();

let userPaintFlagInvalidatorAttached = false;

/**
 * getChatRowItemType calls `hasUserPaint` once per visible row on every list
 * data change, so the paints/userPaintIds traversal below is cached per user
 * id and cleared wholesale whenever either map changes structurally.
 */
function ensureUserPaintFlagInvalidator(): void {
  if (userPaintFlagInvalidatorAttached) {
    return;
  }
  userPaintFlagInvalidatorAttached = true;
  const clear = () => chatStore$.sessionCaches.userPaintFlags.set({});
  chatStore$.userPaintIds.onChange(clear);
  chatStore$.paints.onChange(clear);
}

export const hasUserPaint = (ttvUserId?: string): boolean => {
  if (!ttvUserId) {
    return false;
  }

  ensureUserPaintFlagInvalidator();

  const cached = chatStore$.sessionCaches.userPaintFlags[ttvUserId]?.peek();
  if (cached !== undefined) {
    return cached;
  }

  const paintId = getUserPaintId(ttvUserId);
  const result = Boolean(paintId && getPaint(paintId));

  const flags = chatStore$.sessionCaches.userPaintFlags;
  if (Object.keys(flags.peek()).length >= MAX_COSMETIC_ENTRIES) {
    flags.set({});
  }
  flags[ttvUserId]?.set(result);

  return result;
};

export const addBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const cell = chatStore$.badges[badge.id];
    cell?.set(badge);
    clearMissingBadge(badge.id);
    scheduleCosmeticsPersist();
  }
};

export const getBadge = (badgeId: string): SanitisedBadgeSet | undefined => {
  const badge = chatStore$.badges[badgeId]?.peek();
  if (!badge) {
    return undefined;
  }
  return normalizeSevenTvBadge(badge);
};

export const setUserBadge = (ttvUserId: string, badgeId: string): void => {
  const current = chatStore$.userBadgeIds.peek();

  if (
    !(ttvUserId in current) &&
    Object.keys(current).length >= MAX_COSMETIC_ENTRIES
  ) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(current).slice(trimCount),
    );
    chatStore$.userBadgeIds.set({ ...trimmed, [ttvUserId]: badgeId });
  } else {
    chatStore$.userBadgeIds[ttvUserId]?.set(badgeId);
  }

  // Surface entitlements that reference a badge we have not loaded a
  // definition for yet (e.g. the cosmetic.create has not arrived).
  if (!getBadge(badgeId)) {
    reportMissingBadge(badgeId, ttvUserId);
  }

  scheduleCosmeticsPersist();
};

export const getUserBadge = (
  ttvUserId: string,
): SanitisedBadgeSet | undefined => {
  const badgeId = chatStore$.userBadgeIds[ttvUserId]?.peek();
  if (!badgeId) {
    return undefined;
  }
  const badge = getBadge(badgeId);
  if (!badge) {
    reportMissingBadge(badgeId, ttvUserId);
    return undefined;
  }
  return badge;
};

export const getUserBadgeId = (ttvUserId: string): string | undefined =>
  chatStore$.userBadgeIds[ttvUserId]?.peek();

export const updateBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const cell = chatStore$.badges[badge.id];
    cell?.set(badge);
  }
};

export const removeBadge = (badgeId: string) => {
  const currentBadges = chatStore$.badges.peek();
  const { [badgeId]: _, ...remainingBadges } = currentBadges;
  chatStore$.badges.set(remainingBadges);
  const currentUserBadgeIds = chatStore$.userBadgeIds.peek();

  chatStore$.userBadgeIds.set(
    Object.fromEntries(
      Object.entries(currentUserBadgeIds).filter(
        ([, userBadgeId]) => userBadgeId !== badgeId,
      ),
    ),
  );
};

export const removeUserBadge = (ttvUserId: string) => {
  const current = chatStore$.userBadgeIds.peek();
  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userBadgeIds.set(rest);
};

export const updatePaint = (paint: PaintData) => {
  if (paint.id) {
    const cell = chatStore$.paints[paint.id];
    cell?.set(paint);
  }
};

export const removePaint = (paintId: string) => {
  const currentPaints = chatStore$.paints.peek();
  const { [paintId]: _, ...remainingPaints } = currentPaints;
  chatStore$.paints.set(remainingPaints);
  chatStore$.userPaintIds.set(
    Object.fromEntries(
      Object.entries(chatStore$.userPaintIds.peek()).filter(
        ([, id]) => id !== paintId,
      ),
    ),
  );
};

export const removeUserPaint = (ttvUserId: string) => {
  const current = chatStore$.userPaintIds.peek();
  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userPaintIds.set(rest);
};

export const clearPaints = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
  });
};

export const clearSevenTvBadges = () => {
  batch(() => {
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
};

const clearPaintsAndBadges = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
  clearAllMissingBadges();
  scheduleCosmeticsPersist();
};
