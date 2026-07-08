import { useEffect } from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { sevenTvService } from '@app/services/seventv-service';
import {
  fetchAndCacheUserCosmetics,
  getUserBadge,
  getUserBadgeId,
  hasUserPaint,
  requestUserCosmeticsViaPresence,
} from '@app/store/chat/actions/cosmetics';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { logger } from '@app/utils/logger';

function hasRenderableCosmetics(twitchUserId: string): boolean {
  const badgeId = chatStore$.userBadgeIds[twitchUserId]?.peek();
  const renderableBadge = badgeId
    ? getUserBadge(twitchUserId)?.url?.trim()
    : undefined;
  const paintId = chatStore$.userPaintIds[twitchUserId]?.peek();

  return Boolean(paintId && renderableBadge);
}

export function useChatCosmetics(options: { userId?: string | null } = {}) {
  const { userId } = options;
  const fetchedCosmeticsUsersRef = useLazyRef(() => new Set<string>());

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (hasUserPaint(userId) && getUserBadgeId(userId)) {
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
    options: {
      retryMissingBadge?: boolean;
    } = {},
  ) => {
    const existingBadgeId = chatStore$.userBadgeIds[twitchUserId]?.peek();
    const renderableBadge = existingBadgeId
      ? getUserBadge(twitchUserId)?.url?.trim()
      : undefined;

    if (
      fetchedCosmeticsUsersRef.current.has(twitchUserId) &&
      (!options.retryMissingBadge || renderableBadge)
    ) {
      return;
    }

    if (hasRenderableCosmetics(twitchUserId)) {
      fetchedCosmeticsUsersRef.current.add(twitchUserId);
      return;
    }

    await requestUserCosmeticsViaPresence(twitchUserId);
    fetchedCosmeticsUsersRef.current.add(twitchUserId);
  };

  return {
    fetchedCosmeticsUsersRef,
    fetchUserCosmetics,
  };
}
