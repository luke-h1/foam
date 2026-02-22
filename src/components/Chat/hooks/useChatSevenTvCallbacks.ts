import type {
  CosmeticCreateCallbackData,
  CosmeticUpdateCallbackData,
  CosmeticDeleteCallbackData,
  EntitlementCreateCallbackData,
  EntitlementUpdateCallbackData,
  EntitlementDeleteCallbackData,
} from '@app/hooks/useSeventvWs';
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
} from '@app/store/chatStore';
import type { BadgeData, PaintData } from '@app/utils/color/seventv-ws-service';
import { logger } from '@app/utils/logger';
import { useCallback } from 'react';

import {
  get7TvCosmeticId,
  sanitise7TvBadge,
  toPaintWithId,
} from '../util/sevenTvCosmeticUtils';

function getDataFromChangeValue(value: {
  value?: { object?: { data?: unknown } };
}): unknown {
  return value.value?.object?.data;
}

export function useChatSevenTvCallbacks({
  channelId,
  sevenTvEmoteSetId,
  canFetchCosmetics,
  fetchAndCacheUserCosmetics,
  updateSevenTvEmotes,
}: {
  channelId: string;
  sevenTvEmoteSetId: string | undefined;
  canFetchCosmetics: () => boolean;
  fetchAndCacheUserCosmetics: (sevenTvUserId: string) => Promise<unknown>;
  updateSevenTvEmotes: (
    cId: string,
    added: unknown[],
    removed: unknown[],
  ) => void;
}) {
  const onEmoteUpdate = useCallback(
    ({
      added,
      removed,
      channelId: cId,
    }: {
      added: unknown[];
      removed: unknown[];
      channelId: string;
    }) => {
      logger.stvWs.info(
        `Channel ${cId}: +${added.length} -${removed.length} emotes`,
      );
      updateSevenTvEmotes(cId, added, removed);
    },
    [updateSevenTvEmotes],
  );

  const onCosmeticCreate = useCallback((data: CosmeticCreateCallbackData) => {
    if (!data.cosmetic?.object) return;
    const { object } = data.cosmetic;

    if (data.kind === 'BADGE') {
      const badgeData = object.data as BadgeData & { ref_id?: string };
      const badgeId = get7TvCosmeticId(badgeData);
      if (getBadge(badgeId)) return;
      const sanitised = sanitise7TvBadge(badgeData, badgeId);
      addBadge(sanitised);
      logger.stvWs.info(
        `Added badge to cache: ${badgeData.name} (id: ${badgeId})`,
      );
    } else if (data.kind === 'PAINT') {
      const paintData = object.data as PaintData & { ref_id?: string };
      const paintWithId = toPaintWithId(paintData);
      if (getPaint(paintWithId.id)) return;
      addPaint(paintWithId);
      logger.stvWs.info(
        `Added paint to cache: ${paintData.name} (id: ${paintWithId.id})`,
      );
    }
  }, []);

  const onEntitlementCreate = useCallback(
    (data: EntitlementCreateCallbackData) => {
      const { entitlement } = data;
      const cosmeticId = entitlement.object.ref_id;
      const sevenTvUserId = entitlement.object.user.id;

      const run = async () => {
        if (entitlement.object.kind === 'PAINT') {
          const paintId = cosmeticId || data.paintId;
          if (paintId) {
            if (!getPaint(paintId) && sevenTvUserId) {
              if (canFetchCosmetics())
                await fetchAndCacheUserCosmetics(sevenTvUserId);
              else
                logger.stvWs.debug(
                  'Skipping cosmetic fetch for entitlement - 10s limit exceeded',
                );
            } else if (data.ttvUserId) setUserPaint(data.ttvUserId, paintId);
          }
        }
        if (entitlement.object.kind === 'BADGE') {
          const badgeId = cosmeticId || data.badgeId;
          if (badgeId) {
            if (!getBadge(badgeId) && sevenTvUserId) {
              if (canFetchCosmetics())
                await fetchAndCacheUserCosmetics(sevenTvUserId);
              else
                logger.stvWs.debug(
                  'Skipping cosmetic fetch for entitlement - 10s limit exceeded',
                );
            } else if (data.ttvUserId) setUserBadge(data.ttvUserId, badgeId);
          }
        }
      };
      void run();
    },
    [canFetchCosmetics, fetchAndCacheUserCosmetics],
  );

  const onCosmeticUpdate = useCallback((data: CosmeticUpdateCallbackData) => {
    if (data.kind === 'PAINT') {
      const { changes } = data;
      changes.updated?.forEach(update => {
        const paintData = getDataFromChangeValue(update) as
          | PaintData
          | undefined;
        if (paintData?.id) {
          updatePaint(paintData);
          logger.stvWs.info(`Updated paint in cache: ${paintData.name}`);
        }
      });
      changes.pushed?.forEach(push => {
        const paintData = getDataFromChangeValue(push) as PaintData | undefined;
        if (paintData?.id) {
          addPaint(paintData);
          logger.stvWs.info(`Added paint from update: ${paintData.name}`);
        }
      });
    }
    if (data.kind === 'BADGE') {
      const { changes } = data;
      const toSanitised = (entry: unknown) => {
        const badgeData = getDataFromChangeValue(
          entry as { value?: { object?: { data?: BadgeData } } },
        ) as (BadgeData & { ref_id?: string }) | undefined;
        if (badgeData) return sanitise7TvBadge(badgeData);
        return null;
      };
      changes.updated?.forEach(update => {
        const sanitised = toSanitised(update);
        if (sanitised) {
          updateBadge(sanitised);
          logger.stvWs.info(`Updated badge in cache: ${sanitised.title}`);
        }
      });
      changes.pushed?.forEach(push => {
        const sanitised = toSanitised(push);
        if (sanitised) {
          addBadge(sanitised);
          logger.stvWs.info(`Added badge from update: ${sanitised.title}`);
        }
      });
    }
  }, []);

  const onCosmeticDelete = useCallback((data: CosmeticDeleteCallbackData) => {
    removeBadge(data.cosmeticId);
    removePaint(data.cosmeticId);
    logger.stvWs.info(`Removed cosmetic from cache: ${data.cosmeticId}`);
  }, []);

  const onEntitlementUpdate = useCallback(
    (data: EntitlementUpdateCallbackData) => {
      if (data.ttvUserId) {
        if (data.paintId) setUserPaint(data.ttvUserId, data.paintId);
        else removeUserPaint(data.ttvUserId);
        if (data.badgeId) setUserBadge(data.ttvUserId, data.badgeId);
        else removeUserBadge(data.ttvUserId);
      }
    },
    [],
  );

  const onEntitlementDelete = useCallback(
    (data: EntitlementDeleteCallbackData) => {
      if (data.ttvUserId) {
        removeUserPaint(data.ttvUserId);
        removeUserBadge(data.ttvUserId);
        logger.stvWs.info(`Removed entitlements for user: ${data.ttvUserId}`);
      }
    },
    [],
  );

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
