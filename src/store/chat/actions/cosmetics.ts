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
import { setOnBttvBadgesLoaded } from '@app/utils/chat/bttvBadges';
import {
  convertV4PaintToPaintData,
  type V4Badge,
} from '@app/utils/color/sevenTvPaintData';
import { logger } from '@app/utils/logger';
import { deepEqualJson } from '@app/utils/object/deepEqualJson';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

import { chatStore$ } from '../observables/chatStore';
import {
  writePersistedCosmeticBindings,
  writePersistedCosmeticDefinitions,
} from '../observables/cosmeticsPersistence';
import { MAX_COSMETIC_ENTRIES } from '../types/constants';
import {
  clearAllMissingBadges,
  clearMissingBadge,
  reportMissingBadge,
} from './missingBadges';

export { getMissingBadgeIds, hasMissingBadges } from './missingBadges';

export const bumpCosmeticBindingsVersion = (): void => {
  chatStore$.cosmeticBindingsVersion.set(version => version + 1);
};

const COSMETIC_BINDINGS_BUMP_COALESCE_MS = 1000;
let cosmeticBindingsBumpTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleCosmeticBindingsBump = (): void => {
  if (cosmeticBindingsBumpTimer) {
    return;
  }
  cosmeticBindingsBumpTimer = setTimeout(() => {
    cosmeticBindingsBumpTimer = null;
    bumpCosmeticBindingsVersion();
  }, COSMETIC_BINDINGS_BUMP_COALESCE_MS);
};

setOnBttvBadgesLoaded(scheduleCosmeticBindingsBump);

const COSMETICS_PERSIST_DEBOUNCE_MS = 4000;
let cosmeticsPersistTimer: ReturnType<typeof setTimeout> | null = null;
let cosmeticDefinitionsDirty = false;
let cosmeticBindingsDirty = false;

/**
 * Debounced MMKV snapshot of the cosmetic maps. Cosmetics arrive in a burst as
 * a channel loads; coalescing into one write per quiet window keeps this off
 * the hot path. Definitions and bindings persist under separate keys so the
 * steady per-chatter binding syncs stop re-serializing hundreds of full paint
 * definitions - the flush writes only the group(s) that actually changed.
 */
export const scheduleCosmeticsPersist = (
  kind: 'definitions' | 'bindings' | 'both' = 'both',
): void => {
  if (kind !== 'bindings') {
    cosmeticDefinitionsDirty = true;
  }
  if (kind !== 'definitions') {
    cosmeticBindingsDirty = true;
  }
  if (cosmeticsPersistTimer) {
    return;
  }
  cosmeticsPersistTimer = setTimeout(() => {
    cosmeticsPersistTimer = null;
    if (cosmeticDefinitionsDirty) {
      cosmeticDefinitionsDirty = false;
      writePersistedCosmeticDefinitions({
        paints: chatStore$.paints.peek(),
        badges: chatStore$.badges.peek(),
      });
    }
    if (cosmeticBindingsDirty) {
      cosmeticBindingsDirty = false;
      writePersistedCosmeticBindings({
        userPaintIds: chatStore$.userPaintIds.peek(),
        userBadgeIds: chatStore$.userBadgeIds.peek(),
      });
    }
  }, COSMETICS_PERSIST_DEBOUNCE_MS);
};

const USER_COSMETICS_CACHE_PREFIX = 'user-cosmetics:';

const USER_COSMETICS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const USER_COSMETICS_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';

export type CachedUserCosmetics = {
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

function buildCachedUserCosmeticsFromStore(
  ttvUserId: string,
): CachedUserCosmetics {
  const paintId = chatStore$.userPaintIds[ttvUserId]?.peek() ?? null;
  const badgeId = chatStore$.userBadgeIds[ttvUserId]?.peek() ?? null;
  const badge = badgeId ? getBadge(badgeId) : undefined;

  return {
    badge: badge?.url?.trim() ? badge : undefined,
    badgeId,
    expiresAt:
      Date.now() +
      (paintId || badgeId
        ? USER_COSMETICS_CACHE_TTL_MS
        : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
    paint: paintId ? getPaint(paintId) : undefined,
    paintId,
    ttvUserId,
  };
}

export const syncCachedUserCosmeticsFromStore = (
  sevenTvUserId: string,
  ttvUserId: string,
): void => {
  setCachedUserCosmetics(
    sevenTvUserId,
    buildCachedUserCosmeticsFromStore(ttvUserId),
  );
};

function refreshCachedUserCosmeticsForDefinition(cosmeticId: string): void {
  for (const [sevenTvUserId, cached] of Array.from(
    sessionCosmeticsCache.entries(),
  )) {
    if (
      cached.ttvUserId &&
      (cached.paintId === cosmeticId || cached.badgeId === cosmeticId)
    ) {
      syncCachedUserCosmeticsFromStore(sevenTvUserId, cached.ttvUserId);
    }
  }
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

export const fetchUserCosmeticsByTwitchId = async (
  twitchUserId: string,
): Promise<void> => {
  const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
  if (sevenTvUserId) {
    await fetchAndCacheUserCosmetics(sevenTvUserId);
  }
};

export const requestUserCosmeticsViaPresence = async (
  twitchUserId: string,
): Promise<void> => {
  const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
  if (!sevenTvUserId) {
    return;
  }

  const sessionId = getSevenTvSessionId();
  const channelId = chatStore$.currentChannelId.peek();
  if (sessionId && channelId) {
    await sevenTvService.sendPresence(channelId, sevenTvUserId, {
      passive: true,
      sessionId,
    });
    return;
  }

  await fetchAndCacheUserCosmetics(sevenTvUserId);
};

export const clearUserCosmeticsCache = () => {
  if (cosmeticBindingsBumpTimer) {
    clearTimeout(cosmeticBindingsBumpTimer);
    cosmeticBindingsBumpTimer = null;
  }
  userCosmeticsFetchGuard.clear();
  sessionCosmeticsCache.clear();
  clearSevenTvUserIdCache();
  storageService.clearNamespace(
    SEVEN_TV_CACHE_NAMESPACE,
    'sevenTvUserCosmetics_',
  );
  clearPaintsAndBadges();
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
  bumpCosmeticBindingsVersion();
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

  scheduleCosmeticsPersist('bindings');
};

/**
 * Popular paints re-arrive with a fresh object identity per wearer sighting
 * (GQL conversion / MMKV round-trip both construct new objects). Storing an
 * equal-content copy rotates the WeakMap-keyed paint layer caches and
 * re-syncs every cached wearer to MMKV - O(wearers²) during entitlement
 * bursts - so no-op writes are dropped via structural compare.
 */
const isSamePaintDefinition = (
  previous: PaintData | undefined,
  next: PaintData,
): boolean => previous != null && deepEqualJson(previous, next);

const MAX_PAINT_DEFINITIONS = 750;

const sweepUnreferencedPaints = () => {
  const paints = chatStore$.paints.peek();
  const paintIds = Object.keys(paints);
  if (paintIds.length < MAX_PAINT_DEFINITIONS) {
    return;
  }
  const referenced = new Set(Object.values(chatStore$.userPaintIds.peek()));
  const next: typeof paints = {};
  paintIds.forEach(paintId => {
    if (referenced.has(paintId)) {
      next[paintId] = paints[paintId] as PaintData;
    }
  });
  chatStore$.paints.set(next);
};

export const addPaint = (paint: PaintData) => {
  if (paint.id) {
    if (isSamePaintDefinition(chatStore$.paints[paint.id]?.peek(), paint)) {
      return;
    }
    sweepUnreferencedPaints();
    chatStore$.paints[paint.id]?.set(paint);
    scheduleCosmeticsPersist('definitions');
    refreshCachedUserCosmeticsForDefinition(paint.id);
  }
};

export const getPaint = (paintId: string): PaintData | undefined =>
  chatStore$.paints[paintId]?.peek();

export const getUserPaintId = (ttvUserId: string): string | undefined =>
  chatStore$.userPaintIds[ttvUserId]?.peek();

let userPaintFlagInvalidatorAttached = false;

function ensureUserPaintFlagInvalidator(): void {
  if (userPaintFlagInvalidatorAttached) {
    return;
  }
  userPaintFlagInvalidatorAttached = true;
  const clear = () => chatStore$.sessionCaches.userPaintFlags.set({});
  chatStore$.userPaintIds.onChange(({ changes }) => {
    for (const change of changes) {
      const changedUserId = change.path[0];
      if (typeof changedUserId !== 'string') {
        clear();
        return;
      }
      chatStore$.sessionCaches.userPaintFlags[changedUserId]?.delete();
    }
  });
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

/**
 * Same rationale as `isSamePaintDefinition`: badge definitions re-arrive per
 * wearer sighting with fresh identity, and an equal-content rewrite would
 * re-sync every cached wearer to MMKV. Badges are flat, so field comparison
 * is enough.
 */
const isSameBadgeDefinition = (
  previous: SanitisedBadgeSet | undefined,
  next: SanitisedBadgeSet,
): boolean =>
  previous?.id === next.id &&
  previous.url === next.url &&
  previous.type === next.type &&
  previous.title === next.title &&
  previous.set === next.set &&
  previous.provider === next.provider &&
  previous.color === next.color &&
  previous.owner_username === next.owner_username;

export const addBadge = (badge: SanitisedBadgeSet) => {
  if (!badge.id) {
    return;
  }

  const normalizedBadge = normalizeSevenTvBadge(badge);
  if (!normalizedBadge.url?.trim()) {
    return;
  }

  const cell = chatStore$.badges[badge.id];
  const previous = cell?.peek();
  clearMissingBadge(badge.id);
  if (isSameBadgeDefinition(previous, normalizedBadge)) {
    return;
  }

  const previousUrl = previous?.url?.trim();
  cell?.set(normalizedBadge);
  scheduleCosmeticsPersist('definitions');

  if (previousUrl !== normalizedBadge.url.trim()) {
    scheduleCosmeticBindingsBump();
  }

  refreshCachedUserCosmeticsForDefinition(badge.id);
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
  const previousBadgeId = current[ttvUserId];

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

  if (!getBadge(badgeId)) {
    reportMissingBadge(badgeId, ttvUserId);
  }

  if (previousBadgeId !== badgeId) {
    scheduleCosmeticBindingsBump();
  }

  scheduleCosmeticsPersist('bindings');
};

export const getUserBadge = (
  ttvUserId: string,
): SanitisedBadgeSet | undefined => {
  const badgeId = chatStore$.userBadgeIds[ttvUserId]?.peek();
  if (!badgeId) {
    return undefined;
  }
  const badge = getBadge(badgeId);
  if (badge?.url?.trim()) {
    return badge;
  }

  reportMissingBadge(badgeId, ttvUserId);
  return undefined;
};

export const getUserBadgeId = (ttvUserId: string): string | undefined =>
  chatStore$.userBadgeIds[ttvUserId]?.peek();

export const updateBadge = (badge: SanitisedBadgeSet) => {
  if (!badge.id) {
    return;
  }

  const normalizedBadge = normalizeSevenTvBadge(badge);
  if (!normalizedBadge.url?.trim()) {
    return;
  }

  const cell = chatStore$.badges[badge.id];
  const previous = cell?.peek();
  clearMissingBadge(badge.id);
  if (isSameBadgeDefinition(previous, normalizedBadge)) {
    return;
  }

  const previousUrl = previous?.url?.trim();
  cell?.set(normalizedBadge);
  scheduleCosmeticsPersist('definitions');

  if (previousUrl !== normalizedBadge.url.trim()) {
    scheduleCosmeticBindingsBump();
  }

  refreshCachedUserCosmeticsForDefinition(badge.id);
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
  scheduleCosmeticsPersist();
};

export const removeUserBadge = (ttvUserId: string) => {
  const current = chatStore$.userBadgeIds.peek();
  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userBadgeIds.set(rest);
  scheduleCosmeticsPersist('bindings');
  scheduleCosmeticBindingsBump();
};

export const updatePaint = (paint: PaintData) => {
  if (paint.id) {
    if (isSamePaintDefinition(chatStore$.paints[paint.id]?.peek(), paint)) {
      return;
    }
    chatStore$.paints[paint.id]?.set(paint);
    scheduleCosmeticsPersist('definitions');
    refreshCachedUserCosmeticsForDefinition(paint.id);
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
  scheduleCosmeticsPersist();
};

export const removeUserPaint = (ttvUserId: string) => {
  const current = chatStore$.userPaintIds.peek();
  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userPaintIds.set(rest);
  scheduleCosmeticsPersist('bindings');
};

export const clearPaints = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
  });
  scheduleCosmeticsPersist();
};

export const clearPaintBindings = () => {
  chatStore$.userPaintIds.set({});
  scheduleCosmeticsPersist('bindings');
};

export const clearSevenTvBadges = () => {
  batch(() => {
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
  scheduleCosmeticsPersist();
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
