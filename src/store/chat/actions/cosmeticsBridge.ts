import type {
  CosmeticCreate,
  EntitlementCreate,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';
import { get7TvCosmeticId } from '@app/utils/seventv/cosmetics/get7TvCosmeticId';
import { normalizeSevenTvPaint } from '@app/utils/seventv/cosmetics/normalizeSevenTvPaint';
import { sanitise7TvBadge } from '@app/utils/seventv/cosmetics/sanitise7TvBadge';

import { chatStore$ } from '../observables/chatStore';
import {
  addBadge,
  addPaint,
  getBadge,
  getPaint,
  removeUserBadge,
  removeUserCosmetics,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
} from './cosmetics';
import {
  deleteEntitlementTwitchLink,
  getEntitlementTwitchLink,
  getTwitchIdsForSevenTvUser,
  rememberEntitlementTwitchLink,
  rememberSevenTvUserTwitchLink,
  unlinkSevenTvUser,
} from './cosmeticsLinks';
import { handlePersonalEmoteSetEntitlement } from './personalEmotes';

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
    const paintWithId = normalizeSevenTvPaint(paintData);
    if (getPaint(paintWithId.id)) {
      return;
    }
    addPaint(paintWithId);
    logger.stvWs.info(
      `Added paint to cache: ${paintData.name} (id: ${paintWithId.id})`,
    );
  }
};

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
};

export const applyEntitlementResetEvent = (sevenTvUserId: string): void => {
  const twitchIds = getTwitchIdsForSevenTvUser(sevenTvUserId);
  if (!twitchIds || twitchIds.length === 0) {
    return;
  }

  twitchIds.forEach(twitchUserId => {
    removeUserCosmetics(twitchUserId);
  });
  unlinkSevenTvUser(sevenTvUserId);
  logger.stvWs.info(`Reset entitlements for 7TV user: ${sevenTvUserId}`);
};

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
};

export const applyEntitlementDeleteEvent = (data: {
  entitlementId: string;
  ttvUserId: string | null;
}): void => {
  const rememberedLink = getEntitlementTwitchLink(data.entitlementId);
  const ttvUserId = data.ttvUserId ?? rememberedLink?.twitchUserId ?? null;
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

  deleteEntitlementTwitchLink(data.entitlementId);
  logger.stvWs.info(`Removed entitlements for user: ${ttvUserId}`);
};
