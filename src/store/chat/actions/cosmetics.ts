import { batch } from '@legendapp/state';

import { SEVEN_TV_CACHE_NAMESPACE, storageService } from '@app/lib/storage';
import {
  clearSevenTvUserCache,
  sevenTvService,
} from '@app/services/seven-tv-service';
import { setOnBttvBadgesLoaded } from '@app/store/chat/actions/bttv-badges/setOnBttvBadgesLoaded';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';
import { buildSanitisedBadge } from '@app/utils/emote/sanitised/buildSanitisedBadge';
import { logger } from '@app/utils/logger';
import { deepEqualJson } from '@app/utils/object/deepEqualJson';
import { buildSevenTvBadgeImageUrl } from '@app/utils/seven-tv/cosmetics/buildSevenTvBadgeImageUrl';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalizeSevenTvBadge';
import { convertV4PaintToPaintData } from '@app/utils/seven-tv/gql/convertV4PaintToPaintData';
import { sanitiseV4Badge } from '@app/utils/seven-tv/gql/sanitiseV4Badge';
import { getSevenTvSessionId } from '@app/utils/seven-tv/sevenTvSessionId';

import { chatStore$ } from '../observables/chat-store';
import {
  writePersistedCosmeticBindings,
  writePersistedCosmeticDefinitions,
} from '../observables/cosmetics-persistence';
import {
  COSMETICS_CACHE_TTL_MS,
  MAX_COSMETIC_ENTRIES,
  MAX_PERSISTED_COSMETIC_DEFINITIONS,
} from '../types/cache-limits';
import {
  clearEntitlementUserLinkState,
  getSevenTvUserIdForTwitchId,
} from './cosmetics-links';
import {
  invalidateBakedBadges,
  invalidateCosmeticsCache,
} from './invalidation';
import {
  clearAllMissingBadges,
  clearMissingBadge,
  reportMissingBadge,
} from './missing-badges';

const COSMETIC_BINDINGS_BUMP_COALESCE_MS = 1000;
let cosmeticBindingsBumpTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleCosmeticBindingsBump = (): void => {
  if (cosmeticBindingsBumpTimer) {
    return;
  }

  cosmeticBindingsBumpTimer = setTimeout(() => {
    cosmeticBindingsBumpTimer = null;
    invalidateBakedBadges();
  }, COSMETIC_BINDINGS_BUMP_COALESCE_MS);
};

setOnBttvBadgesLoaded(scheduleCosmeticBindingsBump);

const COSMETICS_PERSIST_DEBOUNCE_MS = 4000;
let cosmeticsPersistTimer: ReturnType<typeof setTimeout> | null = null;
let cosmeticDefinitionsDirty = false;
let cosmeticBindingsDirty = false;

const writeDirtyCosmetics = (): void => {
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
};

/**
 * Debounced MMKV snapshot; definitions and bindings persist under separate
 * keys so only the dirty group(s) flush.
 */
const scheduleCosmeticsPersist = (
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
    writeDirtyCosmetics();
  }, COSMETICS_PERSIST_DEBOUNCE_MS);
};

export const flushCosmeticsPersist = (): void => {
  if (cosmeticsPersistTimer) {
    clearTimeout(cosmeticsPersistTimer);
    cosmeticsPersistTimer = null;
  }

  writeDirtyCosmetics();
};

const USER_COSMETICS_CACHE_PREFIX = 'user-cosmetics:';

const USER_COSMETICS_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Binding ids only. A definition copy per wearer would duplicate every
 * popular paint hundreds of times.
 */
export type CachedUserCosmetics = {
  badgeId: string | null;
  expiresAt: number;
  paintId: string | null;
  ttvUserId: string | null;
};

const sessionCosmeticsCache = new Map<string, CachedUserCosmetics>();

const TRIM_COUNT = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);

function dropOldestBindings(
  bindings: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(bindings).slice(TRIM_COUNT));
}

// Cap: entitlement.create bursts on channel entry stormed the network with
// hundreds of parallel getUserCosmeticsGql requests.
const userCosmeticsFetchGuard = createFetchOnceGuard({ maxConcurrent: 4 });

// The presence path only reaches userCosmeticsFetchGuard on the no-session
// fallback, so it needs its own bound.
const userPresenceRequestGuard = createFetchOnceGuard({ maxConcurrent: 4 });

const cacheSessionCosmetics = (
  sevenTvUserId: string,
  cosmetics: CachedUserCosmetics,
): void => {
  setBoundedMapEntry(
    sessionCosmeticsCache,
    sevenTvUserId,
    cosmetics,
    MAX_COSMETIC_ENTRIES,
    { trimFraction: 0.2 },
  );
};

const getUserCosmeticsStorageKey = (sevenTvUserId: string) =>
  `sevenTvUserCosmetics_${USER_COSMETICS_CACHE_PREFIX}${sevenTvUserId}` as const;

/**
 * Suppresses snapshot re-sync during a synchronous apply, so a cache hit
 * cannot stamp a fresh TTL and pin stale cosmetics forever.
 */
let suppressSnapshotSync = false;

function applyCachedUserCosmetics(cosmetics: CachedUserCosmetics) {
  if (!cosmetics.ttvUserId) {
    return;
  }

  const { badgeId, paintId, ttvUserId } = cosmetics;
  suppressSnapshotSync = true;

  try {
    batch(() => {
      if (paintId) {
        setUserPaint(ttvUserId, paintId);
      }

      if (badgeId) {
        setUserBadge(ttvUserId, badgeId);
      }
    });
  } finally {
    suppressSnapshotSync = false;
  }
}

/**
 * An id without its definition (old blobs, or a cleared definitions store)
 * must fall through to a refetch instead of binding to nothing.
 */
const hasResolvableCosmeticDefinitions = (
  cosmetics: CachedUserCosmetics,
): boolean =>
  (!cosmetics.paintId || Boolean(getPaint(cosmetics.paintId))) &&
  (!cosmetics.badgeId || Boolean(getBadge(cosmetics.badgeId)));

function getCachedUserCosmetics(
  sevenTvUserId: string,
): CachedUserCosmetics | undefined {
  const sessionCached = sessionCosmeticsCache.get(sevenTvUserId);

  if (sessionCached && sessionCached.expiresAt > Date.now()) {
    return sessionCached;
  }

  if (sessionCached) {
    sessionCosmeticsCache.delete(sevenTvUserId);
  }

  const stored =
    storageService.getString<CachedUserCosmetics>(
      getUserCosmeticsStorageKey(sevenTvUserId),
      SEVEN_TV_CACHE_NAMESPACE,
    ) ?? undefined;

  // An unresolvable snapshot is not servable, so promoting it into the
  // session map would only churn the map on every sighting of the user.
  if (stored && hasResolvableCosmeticDefinitions(stored)) {
    cacheSessionCosmetics(sevenTvUserId, stored);
  }

  return stored;
}

const deleteCachedUserCosmetics = (sevenTvUserId: string): void => {
  // Drop any pending flush too: a debounced sync landing after this delete
  // would rewrite an entry a definitive null fetch just proved dead.
  for (const [ttvUserId, pendingId] of pendingUserCosmeticsSnapshots) {
    if (pendingId === sevenTvUserId) {
      pendingUserCosmeticsSnapshots.delete(ttvUserId);
    }
  }

  sessionCosmeticsCache.delete(sevenTvUserId);

  storageService.delete(
    getUserCosmeticsStorageKey(sevenTvUserId),
    SEVEN_TV_CACHE_NAMESPACE,
  );
};

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

  return {
    badgeId,
    expiresAt:
      Date.now() +
      (paintId || badgeId
        ? COSMETICS_CACHE_TTL_MS
        : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
    paintId,
    ttvUserId,
  };
}

/**
 * Exported only for its spec; the binding writers below are the callers.
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
 * Dirty wearers coalesce into one flush per quiet window; the 7TV user id
 * resolves at write time because reset events drop the link right after.
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
  if (suppressSnapshotSync) {
    return;
  }

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

/**
 * Removals flush synchronously so an app kill inside the debounce window
 * cannot resurrect a removed cosmetic from the stale snapshot.
 */
const syncUserCosmeticsSnapshotNow = (ttvUserId: string): void => {
  if (suppressSnapshotSync) {
    return;
  }

  const sevenTvUserId = getSevenTvUserIdForTwitchId(ttvUserId);

  if (!sevenTvUserId) {
    return;
  }

  pendingUserCosmeticsSnapshots.delete(ttvUserId);
  syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
};

/**
 * Flush before a bindings wipe, or the debounced flush lands after it and
 * persists paint-less snapshots for wearers who still have cosmetics.
 */
const flushUserCosmeticsSnapshotsBeforeBindingsClear = (): void => {
  if (userCosmeticsSnapshotTimer) {
    clearTimeout(userCosmeticsSnapshotTimer);
    userCosmeticsSnapshotTimer = null;
  }

  flushPendingUserCosmeticsSnapshots();
};

export const fetchAndCacheUserCosmetics = async (
  sevenTvUserId: string,
): Promise<string | null> => {
  const cached = getCachedUserCosmetics(sevenTvUserId);

  if (cached && hasResolvableCosmeticDefinitions(cached)) {
    applyCachedUserCosmetics(cached);
    return cached.ttvUserId;
  }

  return userCosmeticsFetchGuard.run(sevenTvUserId, async ctx => {
    try {
      const cosmetics = await sevenTvService.getUserCosmeticsGql(sevenTvUserId);

      // Otherwise an unresolvable snapshot stays a guaranteed miss for its
      // whole TTL and re-fires this fetch on every sighting.
      if (!cosmetics && cached && ctx.stillCurrent()) {
        deleteCachedUserCosmetics(sevenTvUserId);
      }

      if (!cosmetics) {
        return null;
      }

      const paint = cosmetics.paint
        ? convertV4PaintToPaintData(cosmetics.paint)
        : undefined;

      const badge = cosmetics.badge
        ? sanitiseV4Badge(cosmetics.badge)
        : undefined;

      const cachedCosmetics: CachedUserCosmetics = {
        badgeId: cosmetics.badgeId,
        expiresAt:
          Date.now() +
          (paint || badge
            ? COSMETICS_CACHE_TTL_MS
            : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
        paintId: cosmetics.paintId,
        ttvUserId: cosmetics.ttvUserId,
      };

      if (!ctx.stillCurrent()) {
        return cosmetics.ttvUserId;
      }

      if (paint) {
        addPaint(paint);
      }

      if (badge) {
        addBadge(badge);
      }

      setCachedUserCosmetics(sevenTvUserId, cachedCosmetics);
      applyCachedUserCosmetics(cachedCosmetics);

      return cosmetics.ttvUserId;
    } catch (error) {
      logger.stvWs.error(
        `Error fetching cosmetics for user ${sevenTvUserId}:`,
        error,
      );
      // A transport error keeps the snapshot; only a definitive null response
      // above deletes it.
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

export const requestUserCosmeticsViaPresence = async (
  twitchUserId: string,
): Promise<void> => {
  // The id lookup is cached and single-flight on its own, so it does not need a slot.
  const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);

  if (!sevenTvUserId) {
    return;
  }

  await userPresenceRequestGuard.run(twitchUserId, async () => {
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
  flushCosmeticsPersist();
  invalidateCosmeticsCache();
  invalidateBakedBadges();
};

/**
 * Must not bump `cosmeticBindingsVersion`: bumping here reintroduced a
 * reprocess storm on entitlement bursts - see cosmetics-churn.test.ts.
 */
export const setUserPaint = (ttvUserId: string, paintId: string): void => {
  const current = chatStore$.userPaintIds.peek();
  const previousPaintId = current[ttvUserId];

  if (
    !(ttvUserId in current) &&
    Object.keys(current).length >= MAX_COSMETIC_ENTRIES
  ) {
    chatStore$.userPaintIds.set({
      ...dropOldestBindings(current),
      [ttvUserId]: paintId,
    });
  } else {
    chatStore$.userPaintIds[ttvUserId]?.set(paintId);
  }

  if (previousPaintId !== paintId) {
    scheduleUserCosmeticsSnapshotSync(ttvUserId);
  }

  scheduleCosmeticsPersist('bindings');
};

/**
 * Storing an equal-content paint copy rotates the WeakMap-keyed layer caches
 * and re-syncs every cached wearer to MMKV - O(wearers²) during bursts.
 */
const isSamePaintDefinition = (
  previous: PaintData | undefined,
  next: PaintData,
): boolean => previous != null && deepEqualJson(previous, next);

const sweepUnreferencedPaints = () => {
  const paints = chatStore$.paints.peek();
  const paintEntries = Object.entries(paints);

  if (paintEntries.length < MAX_PERSISTED_COSMETIC_DEFINITIONS) {
    return;
  }

  // Root unexpired session snapshots too: sweeping a paint one still points
  // at turns it into a guaranteed refetch.
  const now = Date.now();

  const referenced = new Set(Object.values(chatStore$.userPaintIds.peek()));

  for (const cosmetics of sessionCosmeticsCache.values()) {
    if (cosmetics.paintId && cosmetics.expiresAt > now) {
      referenced.add(cosmetics.paintId);
    }
  }

  const next: typeof paints = {};

  paintEntries.forEach(([paintId, paint]) => {
    if (referenced.has(paintId)) {
      next[paintId] = paint;
    }
  });

  chatStore$.paints.set(next);
};

/**
 * 7TV re-sends definitions we already hold, so create and update are the
 * same write.
 */
export const addPaint = (paint: PaintData) => {
  const isNewDefinition =
    paint.id &&
    !isSamePaintDefinition(chatStore$.paints[paint.id]?.peek(), paint);

  if (!isNewDefinition) {
    return;
  }

  sweepUnreferencedPaints();
  chatStore$.paints[paint.id]?.set(paint);
  scheduleCosmeticsPersist('definitions');
};

export const getPaint = (paintId: string): PaintData | undefined =>
  chatStore$.paints[paintId]?.peek();

export const getUserPaintId = (ttvUserId: string): string | undefined =>
  chatStore$.userPaintIds[ttvUserId]?.peek();

/**
 * Per-user has-a-paint memo, read imperatively per chat row - a plain bounded
 * Map, since an observable cloned and key-diffed the bucket on every write.
 */
const userPaintFlags = new Map<string, boolean>();

export const clearUserPaintFlagCache = (): void => {
  userPaintFlags.clear();
};

let userPaintFlagInvalidatorAttached = false;

/**
 * A binding change invalidates just that user; a paint definition change
 * clears the cache wholesale.
 */
function ensureUserPaintFlagInvalidator(): void {
  if (userPaintFlagInvalidatorAttached) {
    return;
  }

  userPaintFlagInvalidatorAttached = true;

  chatStore$.userPaintIds.onChange(({ changes }) => {
    for (const change of changes) {
      const changedUserId = change.path[0];

      if (changedUserId === undefined) {
        clearUserPaintFlagCache();
        return;
      }

      userPaintFlags.delete(changedUserId);
    }
  });

  chatStore$.paints.onChange(clearUserPaintFlagCache);
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

const sweepUnreferencedBadges = () => {
  const badges = chatStore$.badges.peek();
  const badgeEntries = Object.entries(badges);

  if (badgeEntries.length < MAX_PERSISTED_COSMETIC_DEFINITIONS) {
    return;
  }

  const now = Date.now();
  const referenced = new Set(Object.values(chatStore$.userBadgeIds.peek()));

  for (const cosmetics of sessionCosmeticsCache.values()) {
    if (cosmetics.badgeId && cosmetics.expiresAt > now) {
      referenced.add(cosmetics.badgeId);
    }
  }

  const next: typeof badges = {};

  badgeEntries.forEach(([badgeId, badge]) => {
    if (referenced.has(badgeId)) {
      next[badgeId] = badge;
    }
  });

  chatStore$.badges.set(next);
};

/**
 * Same rationale as `isSamePaintDefinition`; badges are flat, so field
 * comparison is enough.
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
 * 7TV sends `cosmetic.create` for badges we already hold as often as for new
 * ones, so create and update are the same write.
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
  sweepUnreferencedBadges();
  cell?.set(normalizedBadge);
  scheduleCosmeticsPersist('definitions');

  if (previousUrl !== normalizedBadge.url.trim()) {
    scheduleCosmeticBindingsBump();
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
  const previousBadgeId = current[ttvUserId];

  if (
    !(ttvUserId in current) &&
    Object.keys(current).length >= MAX_COSMETIC_ENTRIES
  ) {
    chatStore$.userBadgeIds.set({
      ...dropOldestBindings(current),
      [ttvUserId]: badgeId,
    });
  } else {
    chatStore$.userBadgeIds[ttvUserId]?.set(badgeId);
  }

  // The badge's cosmetic.create may not have arrived yet.
  if (!getBadge(badgeId)) {
    reportMissingBadge(badgeId, ttvUserId);
  }

  if (previousBadgeId !== badgeId) {
    scheduleCosmeticBindingsBump();
    scheduleUserCosmeticsSnapshotSync(ttvUserId);
  }

  scheduleCosmeticsPersist('bindings');
};

/**
 * A badge's artwork url derives from its id alone, so an entitlement without
 * its `cosmetic.create` still renders; the id is still reported missing.
 */
const synthesiseSevenTvBadge = (badgeId: string): SanitisedBadgeSet =>
  buildSanitisedBadge({
    id: badgeId,
    url: buildSevenTvBadgeImageUrl(badgeId),
    type: '7TV Badge',
    title: '7TV Badge',
    set: badgeId,
    provider: '7tv',
  });

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
  return synthesiseSevenTvBadge(badgeId);
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

  // Badge art is baked into message rows - bump so visible rows reprocess.
  scheduleCosmeticBindingsBump();
};

export const removeUserBadge = (ttvUserId: string) => {
  const current = chatStore$.userBadgeIds.peek();

  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userBadgeIds.set(rest);
  syncUserCosmeticsSnapshotNow(ttvUserId);
  scheduleCosmeticsPersist('bindings');
  scheduleCosmeticBindingsBump();
};

/**
 * Paint definitions are live-bound in `PaintedUsername` - no bindings bump.
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
 * Live Legend selectors drop the paint without a bindings-version bump -
 * same rationale as `setUserPaint`.
 */
export const removeUserPaint = (ttvUserId: string) => {
  const current = chatStore$.userPaintIds.peek();

  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userPaintIds.set(rest);
  syncUserCosmeticsSnapshotNow(ttvUserId);
  scheduleCosmeticsPersist('bindings');
};

/**
 * Entitlement resets drop both bindings; one synchronous flush after both
 * removals keeps the crash-safety write but hits MMKV once per wearer.
 */
export const removeUserCosmetics = (ttvUserId: string): void => {
  const hadBindings =
    ttvUserId in chatStore$.userPaintIds.peek() ||
    ttvUserId in chatStore$.userBadgeIds.peek();

  suppressSnapshotSync = true;

  try {
    removeUserPaint(ttvUserId);
    removeUserBadge(ttvUserId);
  } finally {
    suppressSnapshotSync = false;
  }

  if (hadBindings) {
    syncUserCosmeticsSnapshotNow(ttvUserId);
  }
};

export const clearPaints = () => {
  flushUserCosmeticsSnapshotsBeforeBindingsClear();

  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
  });

  scheduleCosmeticsPersist();
};

export const clearPaintBindings = () => {
  flushUserCosmeticsSnapshotsBeforeBindingsClear();
  chatStore$.userPaintIds.set({});
  scheduleCosmeticsPersist('bindings');
};

export const clearSevenTvBadges = () => {
  flushUserCosmeticsSnapshotsBeforeBindingsClear();

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
