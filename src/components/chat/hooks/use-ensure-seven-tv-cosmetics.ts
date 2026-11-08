import { useEffect } from 'react';

import { sevenTvService } from '@app/services/seven-tv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { hasRenderableCosmetics } from '@app/store/chat/actions/user-cosmetics-fetch';
import { logger } from '@app/utils/logger';

/**
 * Loads one user's 7TV cosmetics, unless a paint or a badge is already known.
 * A user can own only one of the two, so either one counts as known. Chatter
 * fetching during ingest lives in `store/chat/actions/user-cosmetics-fetch`.
 */
export function useEnsureSevenTvCosmetics(twitchUserId?: string | null) {
  useEffect(() => {
    if (!twitchUserId || hasRenderableCosmetics(twitchUserId)) {
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
