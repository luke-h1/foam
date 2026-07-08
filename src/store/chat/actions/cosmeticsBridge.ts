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
  fetchUserCosmeticsByTwitchId,
  getBadge,
  getPaint,
  setUserBadge,
  setUserPaint,
} from './cosmetics';
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
 * Bind an entitlement to its Twitch user. Fetches missing definitions over GQL
 * when `requestMissingDefinitions` is true.
 */
export const applyEntitlementCreateEvent = (
  data: {
    entitlement: EntitlementCreate;
    kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
    ttvUserId: string | null;
    paintId: string | null;
    badgeId: string | null;
  },
  options: { requestMissingDefinitions: boolean },
): void => {
  const { entitlement, kind, ttvUserId } = data;
  const cosmeticId = entitlement.object.ref_id;

  if (kind === 'PAINT') {
    const paintId = cosmeticId || data.paintId;
    if (!paintId || !ttvUserId) {
      return;
    }
    setUserPaint(ttvUserId, paintId);
    if (!getPaint(paintId) && options.requestMissingDefinitions) {
      void fetchUserCosmeticsByTwitchId(ttvUserId);
    }
  }

  if (kind === 'BADGE') {
    const badgeId = cosmeticId || data.badgeId;
    if (!badgeId || !ttvUserId) {
      return;
    }
    setUserBadge(ttvUserId, badgeId);
    if (!getBadge(badgeId) && options.requestMissingDefinitions) {
      void fetchUserCosmeticsByTwitchId(ttvUserId);
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
