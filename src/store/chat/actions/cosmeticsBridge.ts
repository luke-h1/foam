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

const MAX_SEVEN_TV_USER_LINK_ENTRIES = 2000;
const twitchIdsBySevenTvUserId = new Map<string, Set<string>>();
const sevenTvUserIdByTwitchId = new Map<string, string>();
const twitchIdByEntitlementId = new Map<string, string>();

function forgetEntitlementIdsForTwitchUsers(
  twitchUserIds: Iterable<string>,
): void {
  const twitchIds = new Set(twitchUserIds);
  if (twitchIds.size === 0) {
    return;
  }

  for (const [entitlementId, twitchUserId] of twitchIdByEntitlementId) {
    if (twitchIds.has(twitchUserId)) {
      twitchIdByEntitlementId.delete(entitlementId);
    }
  }
}

function rememberEntitlementTwitchLink(
  entitlementId: string,
  twitchUserId: string,
): void {
  if (
    twitchIdByEntitlementId.size >= MAX_SEVEN_TV_USER_LINK_ENTRIES &&
    !twitchIdByEntitlementId.has(entitlementId)
  ) {
    const oldest = twitchIdByEntitlementId.keys().next().value;
    if (oldest !== undefined) {
      twitchIdByEntitlementId.delete(oldest);
    }
  }

  twitchIdByEntitlementId.set(entitlementId, twitchUserId);
}

function rememberSevenTvUserTwitchLink(
  sevenTvUserId: string,
  twitchUserId: string,
): void {
  sevenTvUserIdByTwitchId.set(twitchUserId, sevenTvUserId);
  let twitchIds = twitchIdsBySevenTvUserId.get(sevenTvUserId);
  if (!twitchIds) {
    if (twitchIdsBySevenTvUserId.size >= MAX_SEVEN_TV_USER_LINK_ENTRIES) {
      const oldest = twitchIdsBySevenTvUserId.keys().next().value;
      if (oldest !== undefined) {
        const evictedTwitchIds = twitchIdsBySevenTvUserId.get(oldest);
        evictedTwitchIds?.forEach(twitchId => {
          sevenTvUserIdByTwitchId.delete(twitchId);
        });
        if (evictedTwitchIds) {
          forgetEntitlementIdsForTwitchUsers(evictedTwitchIds);
        }
        twitchIdsBySevenTvUserId.delete(oldest);
      }
    }
    twitchIds = new Set();
    twitchIdsBySevenTvUserId.set(sevenTvUserId, twitchIds);
  }
  twitchIds.add(twitchUserId);
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

function bindEmoteSetStyleCosmetics(
  ttvUserId: string,
  paintId: string | null,
  badgeId: string | null,
): void {
  if (paintId) {
    setUserPaint(ttvUserId, paintId);
  }
  if (badgeId) {
    setUserBadge(ttvUserId, badgeId);
  }
}

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
    rememberEntitlementTwitchLink(entitlement.id, ttvUserId);
  }

  if (kind === 'EMOTE_SET' && ttvUserId) {
    bindEmoteSetStyleCosmetics(ttvUserId, data.paintId, data.badgeId);
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

/**
 * Clear paint and badge bindings for every Twitch account linked to a 7TV user.
 */
export const applyEntitlementResetEvent = (sevenTvUserId: string): void => {
  const twitchIds = twitchIdsBySevenTvUserId.get(sevenTvUserId);
  if (!twitchIds) {
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
  } else {
    removeUserPaint(ttvUserId);
  }

  if (badgeId) {
    setUserBadge(ttvUserId, badgeId);
  } else {
    removeUserBadge(ttvUserId);
  }

  syncUserCosmeticsCacheForTwitchUser(ttvUserId);
};

export const applyEntitlementDeleteEvent = (data: {
  entitlementId: string;
  ttvUserId: string | null;
}): void => {
  const ttvUserId =
    data.ttvUserId ?? twitchIdByEntitlementId.get(data.entitlementId) ?? null;
  if (!ttvUserId) {
    return;
  }

  removeUserPaint(ttvUserId);
  removeUserBadge(ttvUserId);
  syncUserCosmeticsCacheForTwitchUser(ttvUserId);
  twitchIdByEntitlementId.delete(data.entitlementId);
  logger.stvWs.info(`Removed entitlements for user: ${ttvUserId}`);
};

export const clearEntitlementUserLinkState = (): void => {
  twitchIdsBySevenTvUserId.clear();
  sevenTvUserIdByTwitchId.clear();
  twitchIdByEntitlementId.clear();
};
