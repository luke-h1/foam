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
  invalidateBakedBadges,
  invalidateCosmeticsCache,
} from './invalidation';
import {
  clearAllMissingBadges,
  clearMissingBadge,
  reportMissingBadge,
} from './missingBadges';

export { getMissingBadgeIds, hasMissingBadges } from './missingBadges';

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

/**
 * Per-user cosmetics snapshot: binding ids only. Definitions live once in
 * `chatStore$.paints` / `chatStore$.badges` (persisted via the cosmetics
 * snapshot) and are resolved by id at apply time - embedding a copy per
 * wearer duplicated every popular paint hundreds of times.
 */
export type CachedUserCosmetics = {
  badgeId: string | null;
  expiresAt: number;
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

/**
 * Applying a cached snapshot goes through the same binding writers as live
 * entitlements, and those writers re-sync the snapshot they were just applied
 * from - stamping a fresh TTL on every cache hit, so stale cosmetics pin
 * indefinitely while the user is seen. Suppressing the sync for the duration
 * of the synchronous apply keeps cache reads from counting as writes.
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
 * An id without its definition (old embedded-shape blobs, or a definitions
 * store cleared since the snapshot was written) must fall through to a
 * refetch instead of binding to nothing.
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

  // An unresolvable snapshot is not servable, so promoting it into the
  // session map would only churn the map on every sighting of the user.
  if (stored && hasResolvableCosmeticDefinitions(stored)) {
    cacheSessionCosmetics(sevenTvUserId, stored);
  }

  return stored;
}

const deleteCachedUserCosmetics = (sevenTvUserId: string): void => {
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
        ? USER_COSMETICS_CACHE_TTL_MS
        : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
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
 * Removal counterpart to the debounced schedule: an app kill inside the debounce
 * window must not resurrect a removed cosmetic from the stale snapshot, so
 * removals flush the wearer synchronously. Called after the store mutation so
 * the snapshot reflects the post-removal state, and resolved here because the
 * entitlement bridge unlinks the 7TV user only after clearing the bindings.
 */
const syncUserCosmeticsSnapshotNow = (ttvUserId: string): void => {
  const sevenTvUserId = getSevenTvUserIdForTwitchId(ttvUserId);
  if (!sevenTvUserId) {
    return;
  }

  pendingUserCosmeticsSnapshots.delete(ttvUserId);
  syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
};

/**
 * A bindings wipe (chat unmount, dev-tools clears) does not stop the debounce
 * timer, so a flush landing after the wipe would persist paint-less snapshots
 * with a fresh TTL for wearers who still have cosmetics. Flushing before the
 * wipe writes the snapshots from the still-intact bindings instead.
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
      if (!cosmetics) {
        // Without this, an unresolvable snapshot stays a guaranteed miss for
        // its whole TTL and re-fires this fetch on every sighting.
        if (cached && ctx.stillCurrent()) {
          deleteCachedUserCosmetics(sevenTvUserId);
        }
        return null;
      }

      const paint = cosmetics.paint
        ? convertV4PaintToPaintData(cosmetics.paint)
        : undefined;
      const badge = cosmetics.badge
        ? convertV4BadgeToSanitised(cosmetics.badge)
        : undefined;
      const cachedCosmetics: CachedUserCosmetics = {
        badgeId: cosmetics.badgeId,
        expiresAt:
          Date.now() +
          (paint || badge
            ? USER_COSMETICS_CACHE_TTL_MS
            : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
        paintId: cosmetics.paintId,
        ttvUserId: cosmetics.ttvUserId,
      };

      if (ctx.stillCurrent()) {
        if (paint) {
          addPaint(paint);
        }
        if (badge) {
          addBadge(badge);
        }
        setCachedUserCosmetics(sevenTvUserId, cachedCosmetics);
        applyCachedUserCosmetics(cachedCosmetics);
      }
      return cosmetics.ttvUserId;
    } catch (error) {
      logger.stvWs.error(
        `Error fetching cosmetics for user ${sevenTvUserId}:`,
        error,
      );
      // A transport error keeps the snapshot: its ids may resolve again once
      // the deferred cosmetics hydration lands. Only a definitive null
      // response above deletes it.
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
  invalidateCosmeticsCache();
  invalidateBakedBadges();
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
  // Session snapshots resolve against these definitions too - sweeping a
  // paint a cached snapshot still points at would turn that snapshot into a
  // guaranteed refetch on its next sighting.
  const referenced = new Set(Object.values(chatStore$.userPaintIds.peek()));
  for (const cosmetics of sessionCosmeticsCache.values()) {
    if (cosmetics.paintId) {
      referenced.add(cosmetics.paintId);
    }
  }
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
  }
};

export const getPaint = (paintId: string): PaintData | undefined =>
  chatStore$.paints[paintId]?.peek();

export const getUserPaintId = (ttvUserId: string): string | undefined =>
  chatStore$.userPaintIds[ttvUserId]?.peek();

/**
 * Per-user has-a-paint memo, read imperatively per chat row - a plain bounded
 * Map per the chat-state rule, since routing it through an observable cloned
 * and key-diffed the whole bucket on every write.
 */
const userPaintFlags = new Map<string, boolean>();

export const clearUserPaintFlagCache = (): void => {
  userPaintFlags.clear();
};

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

const MAX_BADGE_DEFINITIONS = 750;

const sweepUnreferencedBadges = () => {
  const badges = chatStore$.badges.peek();
  const badgeIds = Object.keys(badges);
  if (badgeIds.length < MAX_BADGE_DEFINITIONS) {
    return;
  }
  const referenced = new Set(Object.values(chatStore$.userBadgeIds.peek()));
  for (const cosmetics of sessionCosmeticsCache.values()) {
    if (cosmetics.badgeId) {
      referenced.add(cosmetics.badgeId);
    }
  }
  const next: typeof badges = {};
  badgeIds.forEach(badgeId => {
    if (referenced.has(badgeId)) {
      next[badgeId] = badges[badgeId] as SanitisedBadgeSet;
    }
  });
  chatStore$.badges.set(next);
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
  const current = chatStore$.userPaintIds.peek();
  if (!(ttvUserId in current)) {
    return;
  }

  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userPaintIds.set(rest);
  syncUserCosmeticsSnapshotNow(ttvUserId);
  scheduleCosmeticsPersist('bindings');
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
