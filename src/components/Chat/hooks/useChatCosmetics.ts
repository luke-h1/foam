import { useEffect } from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { sevenTvService } from '@app/services/seventv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { requestUserCosmetics } from '@app/store/chat/actions/cosmeticsBridge';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { logger } from '@app/utils/logger';

export function useChatCosmetics({ userId }: { userId?: string | null }) {
  const fetchedCosmeticsUsersRef = useLazyRef(() => new Set<string>());

  const fetchUserCosmetics = async (
    twitchUserId: string,
    login: string,
    options: {
      retryMissingBadge?: boolean;
    } = {},
  ) => {
    const existingBadgeId = chatStore$.userBadgeIds[twitchUserId]?.peek();
    if (
      fetchedCosmeticsUsersRef.current.has(twitchUserId) &&
      (!options.retryMissingBadge || existingBadgeId)
    ) {
      return;
    }

    const existingPaintId = chatStore$.userPaintIds[twitchUserId]?.peek();
    if (existingPaintId && existingBadgeId) {
      fetchedCosmeticsUsersRef.current.add(twitchUserId);
      logger.stvWs.debug(
        `User ${twitchUserId} already has paint and badge cosmetics`,
      );
      return;
    }

    if (!login) {
      return;
    }

    fetchedCosmeticsUsersRef.current.add(twitchUserId);

    // The bridge batcher coalesces every user queued in the same window into
    // one request and applies the returned dispatches to the store; the await
    // lets callers re-check the cosmetic maps once the batch has landed.
    try {
      await requestUserCosmetics(twitchUserId, login);
    } catch (error) {
      logger.stvWs.debug(
        `Failed to fetch cosmetics for ${twitchUserId}:`,
        error,
      );
    }
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const sevenTvUserId = await sevenTvService.get7tvUserId(userId);

        if (cancelled || !sevenTvUserId) {
          return;
        }

        await fetchAndCacheUserCosmetics(sevenTvUserId);
        logger.stvWs.info(`Fetched cosmetics for current user: ${userId}`);
      } catch (error) {
        if (!cancelled) {
          logger.stvWs.warn('Failed to fetch current user cosmetics:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    fetchedCosmeticsUsersRef,
    fetchUserCosmetics,
  };
}
