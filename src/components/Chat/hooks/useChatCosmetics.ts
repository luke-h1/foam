import { sevenTvService } from '@app/services/seventv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chatStore/cosmetics';
import { chatStore$ } from '@app/store/chatStore/state';
import { logger } from '@app/utils/logger';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useEffect, useRef, useCallback } from 'react';

export function useChatCosmetics({
  channelId,
  userId,
}: {
  channelId: string;
  userId?: string | null;
}) {
  const fetchedCosmeticsUsersRef = useLazyRef(() => new Set<string>());
  const chatStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    chatStartTimeRef.current = Date.now();
  }, [channelId]);

  const canFetchCosmetics = useCallback((): boolean => {
    const chatStartTime = chatStartTimeRef.current;
    if (!chatStartTime) {
      return true;
    }

    return (Date.now() - chatStartTime) / 1000 <= 5;
  }, []);

  const fetchUserCosmetics = async (
    twitchUserId: string,
    options: {
      allowAfterInitialWindow?: boolean;
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

    if (!options.allowAfterInitialWindow && !canFetchCosmetics()) {
      const chatStartTime = chatStartTimeRef.current;
      const elapsedSeconds = chatStartTime
        ? (Date.now() - chatStartTime) / 1000
        : 0;
      logger.stvWs.debug(
        `Skipping cosmetic fetch for ${twitchUserId} - chat has been active for ${elapsedSeconds.toFixed(1)}s (limit: 5s)`,
      );
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

    fetchedCosmeticsUsersRef.current.add(twitchUserId);

    try {
      logger.stvWs.info(`Fetching cosmetics for user ${twitchUserId}...`);
      const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);

      if (sevenTvUserId) {
        logger.stvWs.info(
          `Got 7TV user ID ${sevenTvUserId} for Twitch user ${twitchUserId}`,
        );
        await fetchAndCacheUserCosmetics(sevenTvUserId);
        logger.stvWs.info(`Finished fetching cosmetics for ${twitchUserId}`);
      } else {
        logger.stvWs.debug(`No 7TV user ID found for ${twitchUserId}`);
      }
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
    canFetchCosmetics,
    fetchedCosmeticsUsersRef,
    fetchUserCosmetics,
  };
}
