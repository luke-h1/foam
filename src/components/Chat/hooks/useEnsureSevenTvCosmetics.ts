import { useEffect } from 'react';

import { sevenTvService } from '@app/services/seventv-service';
import {
  fetchAndCacheUserCosmetics,
  getUserBadgeId,
  hasUserPaint,
} from '@app/store/chat/actions/cosmetics';
import { logger } from '@app/utils/logger';

export function useEnsureSevenTvCosmetics(twitchUserId?: string) {
  useEffect(() => {
    if (!twitchUserId) {
      return;
    }

    if (hasUserPaint(twitchUserId) && getUserBadgeId(twitchUserId)) {
      return;
    }

    let cancelled = false;
    void sevenTvService
      .get7tvUserId(twitchUserId)
      .then(sevenTvUserId => {
        if (cancelled || !sevenTvUserId) {
          return null;
        }
        return fetchAndCacheUserCosmetics(sevenTvUserId);
      })
      .catch(error => {
        logger.stv.debug(
          `No 7TV cosmetics for user ${twitchUserId}:`,
          error instanceof Error ? error.message : error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [twitchUserId]);
}
