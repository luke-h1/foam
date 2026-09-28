import type {
  CosmeticCreate,
  EntitlementCreate,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';
import { get7TvCosmeticId } from '@app/utils/seventv/cosmetics/get7-tv-cosmetic-id';
import { normalizeSevenTvPaint } from '@app/utils/seventv/cosmetics/normalize-seven-tv-paint';
import { sanitise7TvBadge } from '@app/utils/seventv/cosmetics/sanitise7-tv-badge';

import { chatStore$ } from '../observables/chat-store';
import {
  addBadge,
  addPaint,
  fetchUserCosmeticsByTwitchId,
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
} from './cosmetics-links';
import { handlePersonalEmoteSetEntitlement } from './personal-emotes';

function bindUserPaint(ttvUserId: string, paintId: string): boolean {
  setUserPaint(ttvUserId, paintId);
  return !getPaint(paintId);
}

function bindUserBadge(ttvUserId: string, badgeId: string): boolean {
  setUserBadge(ttvUserId, badgeId);
  return !getBadge(badgeId);
}

const cacheCreatedBadge = (
  badgeData: Extract<CosmeticCreate['object'], { kind: 'BADGE' }>['data'],
): void => {
  const badgeId = get7TvCosmeticId(badgeData);

  if (getBadge(badgeId)) {
    return;
  }

  addBadge(sanitise7TvBadge(badgeData, badgeId));
  logger.stvWs.info(`Added badge to cache: ${badgeData.name} (id: ${badgeId})`);
};

const cacheCreatedPaint = (
  paintData: Extract<CosmeticCreate['object'], { kind: 'PAINT' }>['data'],
): void => {
  const paintWithId = normalizeSevenTvPaint(paintData);

  if (getPaint(paintWithId.id)) {
    return;
  }

  addPaint(paintWithId);

  logger.stvWs.info(
    `Added paint to cache: ${paintData.name} (id: ${paintWithId.id})`,
  );
};

export const applyCosmeticCreateEvent = (
  cosmetic: CosmeticCreate,
  kind: 'PAINT' | 'BADGE',
): void => {
  if (kind === 'BADGE' && cosmetic.object.kind === 'BADGE') {
    cacheCreatedBadge(cosmetic.object.data);
    return;
  }

  if (kind === 'PAINT' && cosmetic.object.kind === 'PAINT') {
    cacheCreatedPaint(cosmetic.object.data);
  }
};

/**
 * An emote-set entitlement can also carry the user's paint and badge, so bind
 * whatever it names and hydrate once if either was new to the cache.
 */
const applyEmoteSetEntitlement = (
  ttvUserId: string,
  cosmeticId: string | undefined,
  data: { paintId: string | null; badgeId: string | null },
): void => {
  const boundNewPaint = Boolean(
    data.paintId && bindUserPaint(ttvUserId, data.paintId),
  );

  const boundNewBadge = Boolean(
    data.badgeId && bindUserBadge(ttvUserId, data.badgeId),
  );

  if (boundNewPaint || boundNewBadge) {
    void fetchUserCosmeticsByTwitchId(ttvUserId);
  }

  if (cosmeticId) {
    handlePersonalEmoteSetEntitlement(
      ttvUserId,
      cosmeticId,
      chatStore$.currentChannelId.peek(),
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
    applyEmoteSetEntitlement(ttvUserId, cosmeticId, data);
    return;
  }

  const paintId = kind === 'PAINT' ? cosmeticId || data.paintId : null;

  if (paintId && ttvUserId && bindUserPaint(ttvUserId, paintId)) {
    void fetchUserCosmeticsByTwitchId(ttvUserId);
  }

  const badgeId = kind === 'BADGE' ? cosmeticId || data.badgeId : null;

  if (badgeId && ttvUserId && bindUserBadge(ttvUserId, badgeId)) {
    void fetchUserCosmeticsByTwitchId(ttvUserId);
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
