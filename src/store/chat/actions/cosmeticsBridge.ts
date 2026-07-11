import {
  get7TvCosmeticId,
  sanitise7TvBadge,
  toPaintWithId,
} from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import type {
  CosmeticCreate,
  EntitlementCreate,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';

import { chatStore$ } from '../observables/chatStore';
import {
  addBadge,
  addPaint,
  getBadge,
  getPaint,
  removeUserBadge,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
  syncCachedUserCosmeticsFromStore,
} from './cosmetics';
import { handlePersonalEmoteSetEntitlement } from './personalEmotes';

export const MAX_SEVEN_TV_USER_LINK_ENTRIES = 2000;

// Session-scoped 7TV identity/entitlement lookup tables. These are consumed
// only inside this module (never subscribed by components), and every
// entitlement event in a join burst writes them - as observables each write
// cloned and key-diffed the whole ~2000-entry record, so they stay plain Maps.
// Map insertion order gives FIFO for the caps.
const entitlementLinks = new Map<
  string,
  { kind: 'BADGE' | 'PAINT' | 'EMOTE_SET'; twitchUserId: string }
>();
const twitchIdsBySevenTvUserId = new Map<string, string[]>();
const sevenTvUserIdByTwitchId = new Map<string, string>();

function forgetEntitlementIdsForTwitchUsers(
  twitchUserIds: Iterable<string>,
): void {
  const twitchIds = new Set(twitchUserIds);
  if (twitchIds.size === 0) {
    return;
  }

  for (const [entitlementId, link] of entitlementLinks) {
    if (twitchIds.has(link.twitchUserId)) {
      entitlementLinks.delete(entitlementId);
    }
  }
}

function rememberEntitlementTwitchLink(
  entitlementId: string,
  twitchUserId: string,
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET',
): void {
  if (
    !entitlementLinks.has(entitlementId) &&
    entitlementLinks.size >= MAX_SEVEN_TV_USER_LINK_ENTRIES
  ) {
    const oldest = entitlementLinks.keys().next().value;
    if (oldest !== undefined) {
      entitlementLinks.delete(oldest);
    }
  }
  entitlementLinks.set(entitlementId, { kind, twitchUserId });
}

function rememberSevenTvUserTwitchLink(
  sevenTvUserId: string,
  twitchUserId: string,
): void {
  sevenTvUserIdByTwitchId.set(twitchUserId, sevenTvUserId);

  let existing = twitchIdsBySevenTvUserId.get(sevenTvUserId);
  if (!existing) {
    if (twitchIdsBySevenTvUserId.size >= MAX_SEVEN_TV_USER_LINK_ENTRIES) {
      const oldest = twitchIdsBySevenTvUserId.keys().next().value;
      if (oldest !== undefined) {
        const evictedTwitchIds = twitchIdsBySevenTvUserId.get(oldest);
        if (evictedTwitchIds) {
          evictedTwitchIds.forEach(twitchId => {
            sevenTvUserIdByTwitchId.delete(twitchId);
          });
          forgetEntitlementIdsForTwitchUsers(evictedTwitchIds);
        }
        twitchIdsBySevenTvUserId.delete(oldest);
      }
    }
    existing = [];
    twitchIdsBySevenTvUserId.set(sevenTvUserId, existing);
  }
  if (!existing.includes(twitchUserId)) {
    existing.push(twitchUserId);
  }
}

export const applyCosmeticCreateEvent = (
  cosmetic: CosmeticCreate,
  kind: 'PAINT' | 'BADGE',
): void => {
  if (kind === 'BADGE' && cosmetic.object.kind === 'BADGE') {
    const badgeData = cosmetic.object.data;
    const badgeId = get7TvCosmeticId(badgeData);
    if (getBadge(badgeId)) {
      return;
    }
    addBadge(sanitise7TvBadge(badgeData, badgeId));
    logger.stvWs.info(
      `Added badge to cache: ${badgeData.name} (id: ${badgeId})`,
    );
  } else if (kind === 'PAINT' && cosmetic.object.kind === 'PAINT') {
    const paintData = cosmetic.object.data;
    const paintWithId = toPaintWithId(paintData);
    if (getPaint(paintWithId.id)) {
      return;
    }
    addPaint(paintWithId);
    logger.stvWs.info(
      `Added paint to cache: ${paintData.name} (id: ${paintWithId.id})`,
    );
  }
};

/**
 * Bind an entitlement to its Twitch user. Paint and badge definitions are
 * expected from `cosmetic.create` WebSocket events.
 */
export const applyEntitlementCreateEvent = (data: {
  entitlement: EntitlementCreate;
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
}): void => {
  const { entitlement, kind, ttvUserId } = data;
  const cosmeticId = entitlement.object.ref_id;
  const sevenTvUserId = entitlement.object.user?.id;

  if (ttvUserId && sevenTvUserId) {
    rememberSevenTvUserTwitchLink(sevenTvUserId, ttvUserId);
  }

  if (ttvUserId && entitlement.id) {
    rememberEntitlementTwitchLink(entitlement.id, ttvUserId, kind);
  }

  if (kind === 'EMOTE_SET' && ttvUserId) {
    if (data.paintId) {
      setUserPaint(ttvUserId, data.paintId);
    }
    if (data.badgeId) {
      setUserBadge(ttvUserId, data.badgeId);
    }
  }

  if (kind === 'PAINT') {
    const paintId = cosmeticId || data.paintId;
    if (paintId && ttvUserId) {
      setUserPaint(ttvUserId, paintId);
    }
  }

  if (kind === 'BADGE') {
    const badgeId = cosmeticId || data.badgeId;
    if (badgeId && ttvUserId) {
      setUserBadge(ttvUserId, badgeId);
    }
  }

  if (kind === 'EMOTE_SET' && ttvUserId && cosmeticId) {
    handlePersonalEmoteSetEntitlement(
      ttvUserId,
      cosmeticId,
      chatStore$.currentChannelId.peek(),
    );
  }

  if (ttvUserId && sevenTvUserId) {
    syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
  }
};

export const applyEntitlementResetEvent = (sevenTvUserId: string): void => {
  const twitchIds = twitchIdsBySevenTvUserId.get(sevenTvUserId);
  if (!twitchIds || twitchIds.length === 0) {
    return;
  }

  twitchIds.forEach(twitchUserId => {
    removeUserPaint(twitchUserId);
    removeUserBadge(twitchUserId);
    syncCachedUserCosmeticsFromStore(sevenTvUserId, twitchUserId);
    sevenTvUserIdByTwitchId.delete(twitchUserId);
  });
  forgetEntitlementIdsForTwitchUsers(twitchIds);
  twitchIdsBySevenTvUserId.delete(sevenTvUserId);
  logger.stvWs.info(`Reset entitlements for 7TV user: ${sevenTvUserId}`);
};

function syncUserCosmeticsCacheForTwitchUser(ttvUserId: string): void {
  const sevenTvUserId = sevenTvUserIdByTwitchId.get(ttvUserId);
  if (sevenTvUserId) {
    syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
  }
}

export const applyEntitlementUpdateEvent = (data: {
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
}): void => {
  const { ttvUserId, paintId, badgeId } = data;
  if (!ttvUserId) {
    return;
  }

  if (paintId) {
    setUserPaint(ttvUserId, paintId);
  }

  if (badgeId) {
    setUserBadge(ttvUserId, badgeId);
  }

  if (paintId || badgeId) {
    syncUserCosmeticsCacheForTwitchUser(ttvUserId);
  }
};

export const applyEntitlementDeleteEvent = (data: {
  entitlementId: string;
  ttvUserId: string | null;
}): void => {
  const rememberedLink = entitlementLinks.get(data.entitlementId);
  const ttvUserId = data.ttvUserId ?? rememberedLink?.twitchUserId ?? null;
  // Without a remembered kind we cannot tell paint from badge; clearing both
  // would drop the user's remaining cosmetic after an eviction or late delete.
  if (!ttvUserId || !rememberedLink) {
    return;
  }

  switch (rememberedLink.kind) {
    case 'PAINT':
      removeUserPaint(ttvUserId);
      break;
    case 'BADGE':
      removeUserBadge(ttvUserId);
      break;
    case 'EMOTE_SET':
      break;
  }

  syncUserCosmeticsCacheForTwitchUser(ttvUserId);
  entitlementLinks.delete(data.entitlementId);
  logger.stvWs.info(`Removed entitlements for user: ${ttvUserId}`);
};

export const clearEntitlementUserLinkState = (): void => {
  twitchIdsBySevenTvUserId.clear();
  sevenTvUserIdByTwitchId.clear();
  entitlementLinks.clear();
};
