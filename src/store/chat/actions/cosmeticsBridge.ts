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

const entitlementLinks$ = chatStore$.sevenTvUserLinks.twitchIdByEntitlementId;
const twitchIdsBySevenTvUserId$ =
  chatStore$.sevenTvUserLinks.twitchIdsBySevenTvUserId;
const sevenTvUserIdByTwitchId$ =
  chatStore$.sevenTvUserLinks.sevenTvUserIdByTwitchId;

function forgetEntitlementIdsForTwitchUsers(
  twitchUserIds: Iterable<string>,
): void {
  const twitchIds = new Set(twitchUserIds);
  if (twitchIds.size === 0) {
    return;
  }

  const current = entitlementLinks$.peek();
  const next: typeof current = {};
  let changed = false;
  for (const [entitlementId, link] of Object.entries(current)) {
    if (twitchIds.has(link.twitchUserId)) {
      changed = true;
      continue;
    }
    next[entitlementId] = link;
  }
  if (changed) {
    entitlementLinks$.set(next);
  }
}

function rememberEntitlementTwitchLink(
  entitlementId: string,
  twitchUserId: string,
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET',
): void {
  const current = entitlementLinks$.peek();
  const alreadyPresent = entitlementId in current;

  const next: typeof current = { ...current };
  if (!alreadyPresent) {
    const oldest = Object.keys(next)[0];
    if (
      oldest !== undefined &&
      Object.keys(next).length >= MAX_SEVEN_TV_USER_LINK_ENTRIES
    ) {
      delete next[oldest];
    }
  }
  next[entitlementId] = { kind, twitchUserId };
  entitlementLinks$.set(next);
}

function rememberSevenTvUserTwitchLink(
  sevenTvUserId: string,
  twitchUserId: string,
): void {
  const reverse = { ...sevenTvUserIdByTwitchId$.peek() };
  reverse[twitchUserId] = sevenTvUserId;

  const forward = { ...twitchIdsBySevenTvUserId$.peek() };
  let existing = forward[sevenTvUserId];
  if (!existing) {
    const oldest = Object.keys(forward)[0];
    if (
      oldest !== undefined &&
      Object.keys(forward).length >= MAX_SEVEN_TV_USER_LINK_ENTRIES
    ) {
      const evictedTwitchIds = forward[oldest];
      if (evictedTwitchIds) {
        evictedTwitchIds.forEach((twitchId: string) => {
          delete reverse[twitchId];
        });
        forgetEntitlementIdsForTwitchUsers(evictedTwitchIds);
      }
      delete forward[oldest];
    }
    existing = [];
    forward[sevenTvUserId] = existing;
  }
  if (!existing.includes(twitchUserId)) {
    forward[sevenTvUserId] = [...existing, twitchUserId];
  }

  sevenTvUserIdByTwitchId$.set(reverse);
  twitchIdsBySevenTvUserId$.set(forward);
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
  const forward = twitchIdsBySevenTvUserId$.peek();
  const twitchIds = forward[sevenTvUserId];
  if (!twitchIds || twitchIds.length === 0) {
    return;
  }

  const reverseNext = { ...sevenTvUserIdByTwitchId$.peek() };
  twitchIds.forEach(twitchUserId => {
    removeUserPaint(twitchUserId);
    removeUserBadge(twitchUserId);
    syncCachedUserCosmeticsFromStore(sevenTvUserId, twitchUserId);
    delete reverseNext[twitchUserId];
  });
  forgetEntitlementIdsForTwitchUsers(twitchIds);

  const forwardNext = { ...forward };
  delete forwardNext[sevenTvUserId];

  sevenTvUserIdByTwitchId$.set(reverseNext);
  twitchIdsBySevenTvUserId$.set(forwardNext);
  logger.stvWs.info(`Reset entitlements for 7TV user: ${sevenTvUserId}`);
};

function syncUserCosmeticsCacheForTwitchUser(ttvUserId: string): void {
  const sevenTvUserId = sevenTvUserIdByTwitchId$.peek()[ttvUserId];
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
  const current = entitlementLinks$.peek();
  const rememberedLink = current[data.entitlementId];
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
  const next = { ...current };
  delete next[data.entitlementId];
  entitlementLinks$.set(next);
  logger.stvWs.info(`Removed entitlements for user: ${ttvUserId}`);
};

export const clearEntitlementUserLinkState = (): void => {
  twitchIdsBySevenTvUserId$.set({});
  sevenTvUserIdByTwitchId$.set({});
  entitlementLinks$.set({});
};
