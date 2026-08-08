import { batch } from '@legendapp/state';

import { storageService } from '@app/lib/storage';
import {
  clearSevenTvUserCache,
  sevenTvService,
} from '@app/services/seventv-service';
import type { PaintData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { setOnBttvBadgesLoaded } from '@app/utils/chat/bttvBadges/setOnBttvBadgesLoaded';
import { convertV4PaintToPaintData } from '@app/utils/color/sevenTvPaintData/convertV4PaintToPaintData';
import { type V4Badge } from '@app/utils/color/sevenTvPaintData/types';
import { logger } from '@app/utils/logger';
import { deepEqualJson } from '@app/utils/object/deepEqualJson';
import { buildSevenTvBadgeImageUrl } from '@app/utils/seventv/cosmetics/buildSevenTvBadgeImageUrl';
import { normalizeSevenTvBadge } from '@app/utils/seventv/cosmetics/normalizeSevenTvBadge';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

import { chatStore$ } from '../observables/chatStore';
import {
  writePersistedCosmeticBindings,
  writePersistedCosmeticDefinitions,
} from '../observables/cosmeticsPersistence';
import { MAX_COSMETIC_ENTRIES } from '../types/constants';
import {
  clearEntitlementUserLinkState,
  getSevenTvUserIdForTwitchId,
} from './cosmeticsLinks';
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

// Keep persisted 7TV user cosmetics for at most 2 hours before refetching.
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

// The presence path does its own get7tvUserId + sendPresence round trips and
// only reaches userCosmeticsFetchGuard on the no-session fallback, so it needs
// its own bound - the hydrate pass asks for a screenful of chatters at once.
const userPresenceRequestGuard = createFetchOnceGuard({ maxConcurrent: 4 });

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

/**
 * Mirror live chatStore bindings into the per-user GQL cache. Internal to the
 * store: callers never sync by hand - the binding writers below schedule the
 * debounced snapshot sync themselves.
 */
export const syncCachedUserCosmeticsFromStore = (
  sevenTvUserId: string,
  ttvUserId: string,
): void => {
  setCachedUserCosmetics(
    sevenTvUserId,
    buildCachedUserCosmeticsFromStore(ttvUserId),
  );
};

/**
 * Debounced per-user snapshot syncs derived from binding writes, following the
 * scheduleCosmeticsPersist pattern: entitlements arrive in bursts, so dirty
 * wearers coalesce into one flush per quiet window (matching the bindings-bump
 * coalesce). The 7TV user id is resolved at write time because reset events
 * drop the link right after clearing the bindings.
 */
const USER_COSMETICS_SNAPSHOT_DEBOUNCE_MS = 1000;
let userCosmeticsSnapshotTimer: ReturnType<typeof setTimeout> | null = null;
const pendingUserCosmeticsSnapshots = new Map<string, string>();

const flushPendingUserCosmeticsSnapshots = (): void => {
  const pending = Array.from(pendingUserCosmeticsSnapshots.entries());
  pendingUserCosmeticsSnapshots.clear();
  pending.forEach(([ttvUserId, sevenTvUserId]) => {
    syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
  });
};

const scheduleUserCosmeticsSnapshotSync = (ttvUserId: string): void => {
  const sevenTvUserId = getSevenTvUserIdForTwitchId(ttvUserId);
  if (!sevenTvUserId) {
    return;
  }

  pendingUserCosmeticsSnapshots.set(ttvUserId, sevenTvUserId);
  if (userCosmeticsSnapshotTimer) {
    return;
  }
  userCosmeticsSnapshotTimer = setTimeout(() => {
    userCosmeticsSnapshotTimer = null;
    flushPendingUserCosmeticsSnapshots();
  }, USER_COSMETICS_SNAPSHOT_DEBOUNCE_MS);
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

/**
 * Fetch a chatter's cosmetics via v4 GQL from their Twitch id. Used when a
 * WebSocket entitlement arrives without its cosmetic definition.
 */
export const fetchUserCosmeticsByTwitchId = async (
  twitchUserId: string,
): Promise<void> => {
  const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
  if (sevenTvUserId) {
    await fetchAndCacheUserCosmetics(sevenTvUserId);
  }
};

/**
 * Request a chatter's cosmetics via a passive 7TV presence write. Falls back to
 * v4 GQL when there is no live EventAPI session.
 */
export const requestUserCosmeticsViaPresence = async (
  twitchUserId: string,
): Promise<void> => {
  await userPresenceRequestGuard.run(twitchUserId, async () => {
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
  });
};

export const clearUserCosmeticsCache = () => {
  if (cosmeticBindingsBumpTimer) {
    clearTimeout(cosmeticBindingsBumpTimer);
    cosmeticBindingsBumpTimer = null;
  }
  if (userCosmeticsSnapshotTimer) {
    clearTimeout(userCosmeticsSnapshotTimer);
    userCosmeticsSnapshotTimer = null;
  }
  pendingUserCosmeticsSnapshots.clear();
  clearEntitlementUserLinkState();
  userCosmeticsFetchGuard.clear();
  userPresenceRequestGuard.clear();
  sessionCosmeticsCache.clear();
  clearSevenTvUserCache();
  storageService.clearNamespace(
    SEVEN_TV_CACHE_NAMESPACE,
    'sevenTvUserCosmetics_',
  );
  clearPaintsAndBadges();
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
  bumpCosmeticBindingsVersion();
};

/**
 * Paint wearer bindings are read live from `chatStore$.userPaintIds` /
 * `paints` in `PaintedUsername` and `UserChatBody`, so they must not bump
 * `cosmeticBindingsVersion` (that restart is for badge rows baked into
 * messages). Bumping here reintroduced a reprocess storm on entitlement
 * bursts - see cosmeticsChurn.test.ts.
 */
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

  scheduleUserCosmeticsSnapshotSync(ttvUserId);
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

/**
 * Adds or replaces a paint definition. 7TV re-sends definitions we already
 * hold, so create and update are the same write.
 */
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

/**
 * getChatRowItemType runs per row on every list data change; caching the
 * two-peek paints/userPaintIds traversal per user avoids re-walking those
 * observables for every row on every render. A plain bounded Map, not an
 * observable: it is only ever read imperatively during render, and routing it
 * through the store cloned and key-diffed the whole bucket on every write.
 */
const userPaintFlags = new Map<string, boolean>();
let userPaintFlagInvalidatorAttached = false;

/**
 * A binding change invalidates just that user, a paint definition change clears
 * the cache wholesale. `useEnsureSevenTvCosmetics` is the only reader, once per
 * user card, so the cache is far larger than that path needs.
 */
function ensureUserPaintFlagInvalidator(): void {
  if (userPaintFlagInvalidatorAttached) {
    return;
  }
  userPaintFlagInvalidatorAttached = true;
  chatStore$.userPaintIds.onChange(({ changes }) => {
    for (const change of changes) {
      const changedUserId = change.path[0];
      if (typeof changedUserId !== 'string') {
        userPaintFlags.clear();
        return;
      }
      userPaintFlags.delete(changedUserId);
    }
  });
  chatStore$.paints.onChange(() => userPaintFlags.clear());
}

export const hasUserPaint = (ttvUserId?: string): boolean => {
  if (!ttvUserId) {
    return false;
  }

  ensureUserPaintFlagInvalidator();

  const cached = userPaintFlags.get(ttvUserId);
  if (cached !== undefined) {
    return cached;
  }

  const paintId = getUserPaintId(ttvUserId);
  const result = Boolean(paintId && getPaint(paintId));

  if (userPaintFlags.size >= MAX_COSMETIC_ENTRIES) {
    userPaintFlags.clear();
  }
  userPaintFlags.set(ttvUserId, result);

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

/**
 * Adds or replaces a badge definition. 7TV sends `cosmetic.create` for badges
 * we already hold as often as for new ones, so create and update are the same
 * write.
 */
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

  /**
   * Surface entitlements that reference a badge we have not loaded a
   * definition for yet (e.g. the cosmetic.create has not arrived).
   */
  if (!getBadge(badgeId)) {
    reportMissingBadge(badgeId, ttvUserId);
  }

  if (previousBadgeId !== badgeId) {
    scheduleCosmeticBindingsBump();
  }

  scheduleUserCosmeticsSnapshotSync(ttvUserId);
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

export const removeBadge = (badgeId: string) => {
  const currentBadges = chatStore$.badges.peek();
  if (!(badgeId in currentBadges)) {
    return;
  }

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
  // Badge art is baked into message rows — bump so visible rows reprocess.
  scheduleCosmeticBindingsBump();
};

export const removeUserBadge = (ttvUserId: string) => {
  scheduleUserCosmeticsSnapshotSync(ttvUserId);

  const current = chatStore$.userBadgeIds.peek();
  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userBadgeIds.set(rest);
  scheduleCosmeticsPersist('bindings');
  scheduleCosmeticBindingsBump();
};

/**
 * Paint definitions are live-bound in `PaintedUsername` — no bindings bump.
 * Cleared wearer ids drop via Legend selectors without a chat reprocess.
 */
export const removePaint = (paintId: string) => {
  const currentPaints = chatStore$.paints.peek();
  if (!(paintId in currentPaints)) {
    return;
  }

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

/**
 * Live Legend selectors drop the paint without a bindings-version bump —
 * same rationale as `setUserPaint`.
 */
export const removeUserPaint = (ttvUserId: string) => {
  scheduleUserCosmeticsSnapshotSync(ttvUserId);

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
  scheduleCosmeticBindingsBump();
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
