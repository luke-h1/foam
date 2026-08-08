import { useEffect } from 'react';

import { sevenTvService } from '@app/services/seventv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { hasRenderableCosmetics } from '@app/store/chat/actions/userCosmeticsFetch';
import { logger } from '@app/utils/logger';

/**
 * Only the signed-in user's own cosmetics; chatter fetching lives in
 * `store/chat/actions/userCosmeticsFetch`.
 */
export function useChatCosmetics(options: { userId?: string | null } = {}) {
  const { userId } = options;

  useEffect(() => {
    if (!userId || hasRenderableCosmetics(userId)) {
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
}
