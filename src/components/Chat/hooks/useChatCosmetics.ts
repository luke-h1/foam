import { useEffect } from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { sevenTvService } from '@app/services/seventv-service';
import {
  fetchAndCacheUserCosmetics,
  getUserBadge,
  getUserBadgeId,
  getUserPaintId,
  requestUserCosmeticsViaPresence,
} from '@app/store/chat/actions/cosmetics';
import { logger } from '@app/utils/logger';

import { boundedSetAdd } from '../util/hydrateVisibleSevenTvAssets/boundedSetAdd';

const MAX_FETCHED_COSMETICS_USERS = 500;

function hasRenderableCosmetics(twitchUserId: string): boolean {
  const badgeId = getUserBadgeId(twitchUserId);
  const renderableBadge = badgeId
    ? getUserBadge(twitchUserId)?.url?.trim()
    : undefined;
  const paintId = getUserPaintId(twitchUserId);

  return Boolean(paintId || renderableBadge);
}

export function useChatCosmetics(options: { userId?: string | null } = {}) {
  const { userId } = options;
  const fetchedCosmeticsUsersRef = useLazyRef(() => new Set<string>());

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (hasRenderableCosmetics(userId)) {
      return;
    }

    let cancelled = false;
    void sevenTvService
      .get7tvUserId(userId)
      .then(sevenTvUserId => {
        if (cancelled || !sevenTvUserId) {
          return null;
        }
        return fetchAndCacheUserCosmetics(sevenTvUserId);
      })
      .catch(error => {
        logger.stv.debug(
          `No 7TV cosmetics for current user ${userId}:`,
          error instanceof Error ? error.message : error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fetchUserCosmetics = async (
    twitchUserId: string,
    fetchOptions: {
      retryMissingBadge?: boolean;
    } = {},
  ) => {
    const existingBadgeId = getUserBadgeId(twitchUserId);
    const renderableBadge = existingBadgeId
      ? getUserBadge(twitchUserId)?.url?.trim()
      : undefined;

    if (
      fetchedCosmeticsUsersRef.current.has(twitchUserId) &&
      (!fetchOptions.retryMissingBadge || renderableBadge || !existingBadgeId)
    ) {
      return;
    }

    if (hasRenderableCosmetics(twitchUserId)) {
      boundedSetAdd(
        fetchedCosmeticsUsersRef.current,
        twitchUserId,
        MAX_FETCHED_COSMETICS_USERS,
      );
      return;
    }

    fetchedCosmeticsUsersRef.current.add(twitchUserId);

    try {
      await requestUserCosmeticsViaPresence(twitchUserId);
    } catch (error) {
      logger.stv.debug(
        `Failed to fetch cosmetics for user ${twitchUserId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  };

  return {
    fetchedCosmeticsUsersRef,
    fetchUserCosmetics,
  };
}
