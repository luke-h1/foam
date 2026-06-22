import type {
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementUpdateCallbackData,
} from '@app/hooks/useSeventvWs';
import { countMetric } from '@app/lib/sentry';
import {
  addBadge,
  addPaint,
  getBadge,
  getPaint,
  removeBadge,
  removePaint,
  removeUserBadge,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
  updateBadge,
  updatePaint,
} from '@app/store/chat/actions/cosmetics';
import type { SanitisedEmote } from '@app/types/emote';
import type {
  BadgeCosmetic,
  BadgeData,
  PaintCosmetic,
  PaintData,
} from '@app/utils/color/seventv-ws-service';
import { generateStvEmoteNotice } from '@app/utils/emote/stv/generateSevenTvEmoteNotice';
import { logger } from '@app/utils/logger';

import {
  get7TvCosmeticId,
  sanitise7TvBadge,
  toPaintWithId,
} from '../util/normalizeSevenTvCosmetics';

function getDataFromChangeValue(entry: unknown): unknown {
  if (typeof entry !== 'object' || entry === null || !('value' in entry)) {
    return undefined;
  }

  const value = (entry as { value?: { object?: { data?: unknown } } }).value;
  return value?.object?.data;
}

function shouldSuppressEmoteNotice(emote: SanitisedEmote): boolean {
  return emote.name?.toLowerCase().includes('nnys') ?? false;
}

function isBadgeCosmetic(
  cosmetic: BadgeCosmetic | PaintCosmetic,
): cosmetic is BadgeCosmetic {
  return cosmetic.object.kind === 'BADGE';
}

function isPaintCosmetic(
  cosmetic: BadgeCosmetic | PaintCosmetic,
): cosmetic is PaintCosmetic {
  return cosmetic.object.kind === 'PAINT';
}

function isBadgeData(data: unknown): data is BadgeData & { ref_id?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'host' in data
  );
}

function isPaintData(data: unknown): data is PaintData & { ref_id?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'function' in data
  );
}

function onCosmeticCreate(data: CosmeticCreateCallbackData) {
  if (!data.cosmetic?.object) {
    return;
  }
  const { cosmetic } = data;

  if (data.kind === 'BADGE' && isBadgeCosmetic(cosmetic)) {
    const badgeData = cosmetic.object.data;
    const badgeId = get7TvCosmeticId(badgeData);
    if (getBadge(badgeId)) {
      return;
    }
    const sanitised = sanitise7TvBadge(badgeData, badgeId);
    addBadge(sanitised);
    logger.stvWs.info(
      `Added badge to cache: ${badgeData.name} (id: ${badgeId})`,
    );
  } else if (data.kind === 'PAINT' && isPaintCosmetic(cosmetic)) {
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
}

function onCosmeticDelete(data: CosmeticDeleteCallbackData) {
  removeBadge(data.cosmeticId);
  removePaint(data.cosmeticId);
  logger.stvWs.info(`Removed cosmetic from cache: ${data.cosmeticId}`);
}

function onEntitlementUpdate(data: EntitlementUpdateCallbackData) {
  if (data.ttvUserId) {
    if (data.paintId) {
      setUserPaint(data.ttvUserId, data.paintId);
    } else {
      removeUserPaint(data.ttvUserId);
    }
    if (data.badgeId) {
      setUserBadge(data.ttvUserId, data.badgeId);
    } else {
      removeUserBadge(data.ttvUserId);
    }
  }
}

function onEntitlementDelete(data: EntitlementDeleteCallbackData) {
  if (data.ttvUserId) {
    removeUserPaint(data.ttvUserId);
    removeUserBadge(data.ttvUserId);
    logger.stvWs.info(`Removed entitlements for user: ${data.ttvUserId}`);
  }
}

export function useChatSevenTvCallbacks({
  channelId,
  channelName,
  sevenTvEmoteSetId,
  canFetchCosmetics,
  fetchAndCacheUserCosmetics,
  updateSevenTvEmotes,
  onEmoteNotice,
}: {
  channelId: string;
  sevenTvEmoteSetId: string | undefined;
  canFetchCosmetics: () => boolean;
  fetchAndCacheUserCosmetics: (sevenTvUserId: string) => Promise<unknown>;
  updateSevenTvEmotes: (
    cId: string,
    added: SanitisedEmote[],
    removed: SanitisedEmote[],
  ) => void;
  onEmoteNotice?: (message: ReturnType<typeof generateStvEmoteNotice>) => void;
  channelName: string;
}) {
  const onEmoteUpdate = ({
    added,
    removed,
    channelId: cId,
  }: {
    added: SanitisedEmote[];
    removed: SanitisedEmote[];
    channelId: string;
  }) => {
    logger.stvWs.info(
      `Channel ${cId}: +${added.length} -${removed.length} emotes`,
    );
    updateSevenTvEmotes(cId, added, removed);
    added.forEach(emote => {
      if (shouldSuppressEmoteNotice(emote)) {
        return;
      }

      onEmoteNotice?.(
        generateStvEmoteNotice({
          channelName,
          emote,
          type: 'added',
        }),
      );
    });
    removed.forEach(emote => {
      if (shouldSuppressEmoteNotice(emote)) {
        return;
      }

      onEmoteNotice?.(
        generateStvEmoteNotice({
          channelName,
          emote,
          type: 'removed',
        }),
      );
    });
  };

  const onEntitlementCreate = (data: EntitlementCreateCallbackData) => {
    const { entitlement } = data;
    const cosmeticId = entitlement.object.ref_id;
    const sevenTvUserId = entitlement.object.user.id;

    const run = async () => {
      if (entitlement.object.kind === 'PAINT') {
        const paintId = cosmeticId || data.paintId;
        if (paintId) {
          if (!getPaint(paintId) && sevenTvUserId && canFetchCosmetics()) {
            await fetchAndCacheUserCosmetics(sevenTvUserId);
          } else if (!getPaint(paintId) && sevenTvUserId) {
            logger.stvWs.debug(
              'Skipping cosmetic fetch for entitlement - 10s limit exceeded',
            );
          }

          if (data.ttvUserId) {
            setUserPaint(data.ttvUserId, paintId);
          }
        }
      }
      if (entitlement.object.kind === 'BADGE') {
        const badgeId = cosmeticId || data.badgeId;
        if (badgeId) {
          if (!getBadge(badgeId) && sevenTvUserId && canFetchCosmetics()) {
            await fetchAndCacheUserCosmetics(sevenTvUserId);
          } else if (!getBadge(badgeId) && sevenTvUserId) {
            logger.stvWs.debug(
              'Skipping cosmetic fetch for entitlement - 10s limit exceeded',
            );
          }

          if (data.ttvUserId) {
            setUserBadge(data.ttvUserId, badgeId);
          }
        }
      }
    };
    void run();
  };

  const onCosmeticUpdate = (data: CosmeticUpdateCallbackData) => {
    if (data.kind === 'PAINT') {
      const { changes } = data;
      let added_paints = 0;
      let updated_paints = 0;
      changes.updated?.forEach(update => {
        const paintData = getDataFromChangeValue(update);
        if (isPaintData(paintData)) {
          updatePaint(toPaintWithId(paintData));
          updated_paints += 1;
          logger.stvWs.info(`Updated paint in cache: ${paintData.name}`);
        }
      });
      changes.pushed?.forEach(push => {
        const paintData = getDataFromChangeValue(push);
        if (isPaintData(paintData)) {
          addPaint(toPaintWithId(paintData));
          added_paints += 1;
          logger.stvWs.info(`Added paint from update: ${paintData.name}`);
        }
      });

      if (added_paints > 0 || updated_paints > 0) {
        countMetric(
          'seven_tv.cosmetic_update.applied',
          {
            action: 'paint_update_applied',
            channel_id: channelId,
            channel_name: channelName,
            provider: 'seven_tv',
            resource_type: 'paints',
            screen: 'chat',
            seven_tv_emote_set_id: sevenTvEmoteSetId ?? 'unknown',
          },
          added_paints + updated_paints,
        );
        logger.stvWs.info('Applied 7TV paint update', {
          name: 'seven_tv_cosmetics_info',
          action: 'paint_update_applied',
          added_paints,
          channel_id: channelId,
          channel_name: channelName,
          provider: 'seven_tv',
          resource_type: 'paints',
          screen: 'chat',
          seven_tv_emote_set_id: sevenTvEmoteSetId,
          updated_paints,
        });
      }
    }
    if (data.kind === 'BADGE') {
      const { changes } = data;
      let added_badges = 0;
      let updated_badges = 0;
      const toSanitised = (entry: unknown) => {
        const badgeData = getDataFromChangeValue(entry);
        if (isBadgeData(badgeData)) {
          return sanitise7TvBadge(badgeData);
        }
        return null;
      };
      changes.updated?.forEach(update => {
        const sanitised = toSanitised(update);
        if (sanitised) {
          updateBadge(sanitised);
          updated_badges += 1;
          logger.stvWs.info(`Updated badge in cache: ${sanitised.title}`);
        }
      });
      changes.pushed?.forEach(push => {
        const sanitised = toSanitised(push);
        if (sanitised) {
          addBadge(sanitised);
          added_badges += 1;
          logger.stvWs.info(`Added badge from update: ${sanitised.title}`);
        }
      });

      if (added_badges > 0 || updated_badges > 0) {
        countMetric(
          'seven_tv.cosmetic_update.applied',
          {
            action: 'badge_update_applied',
            channel_id: channelId,
            channel_name: channelName,
            provider: 'seven_tv',
            resource_type: 'badges',
            screen: 'chat',
            seven_tv_emote_set_id: sevenTvEmoteSetId ?? 'unknown',
          },
          added_badges + updated_badges,
        );
        logger.stvWs.info('Applied 7TV badge update', {
          name: 'seven_tv_badges_info',
          action: 'badge_update_applied',
          added_badges,
          channel_id: channelId,
          channel_name: channelName,
          provider: 'seven_tv',
          resource_type: 'badges',
          screen: 'chat',
          seven_tv_emote_set_id: sevenTvEmoteSetId,
          updated_badges,
        });
      }
    }
  };

  return {
    onEmoteUpdate,
    onCosmeticCreate,
    onEntitlementCreate,
    onCosmeticUpdate,
    onCosmeticDelete,
    onEntitlementUpdate,
    onEntitlementDelete,
    twitchChannelId: channelId,
    sevenTvEmoteSetId,
  };
}
