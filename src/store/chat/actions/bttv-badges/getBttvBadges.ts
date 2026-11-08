import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { onBadgesLoaded } from '@app/store/chat/actions/bttv-badges/onBadgesLoaded';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { logger } from '@app/utils/logger';

const INITIAL_RETRY_DELAY_MS = 10_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;
const BTTV_BADGES_KEY = 'bttv-global-badges';

const bttvBadgesGuard = createFetchOnceGuard();

let cachedBadges: SanitisedBadgeSet[] = [];
let retryDelayMs = INITIAL_RETRY_DELAY_MS;
let nextRetryAt = 0;

function scheduleRetry(): void {
  nextRetryAt = Date.now() + retryDelayMs;
  retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
}

function loadBttvBadges(): void {
  void bttvBadgesGuard.run(BTTV_BADGES_KEY, async ctx => {
    try {
      // oxlint-disable-next-line react-doctor/async-defer-await -- the guard below fences a result that a cache clear made stale during this await
      const badges = await bttvEmoteService.getSanitisedGlobalBadges();

      // A refresh started a newer fetch; this one's result is stale and would
      // otherwise overwrite the newer badges, empty result included.
      if (!ctx.stillCurrent()) {
        return;
      }

      cachedBadges = badges;

      if (badges.length > 0) {
        retryDelayMs = INITIAL_RETRY_DELAY_MS;
        ctx.markFetched();
        onBadgesLoaded.current?.();
        return;
      }

      // Empty success can be transient CDN/API flakiness - back off and retry
      // instead of sticking on one empty list with no loaded callback.
      scheduleRetry();
    } catch (error) {
      if (!ctx.stillCurrent()) {
        return;
      }

      scheduleRetry();

      logger.chat.warn('Failed to fetch BTTV badges', {
        error: error instanceof Error ? error : String(error),
      });
    }
  });
}

/**
 * Invalidates the once-per-process fetch and fences whatever is in flight;
 * loaded badges stay readable until the new list lands.
 */
export function clearBttvBadgesCache(): void {
  bttvBadgesGuard.clear();
  retryDelayMs = INITIAL_RETRY_DELAY_MS;
  nextRetryAt = 0;
}

/**
 * Synchronous accessor so the per-message badge resolver never awaits: the
 * first call kicks off the fetch and returns an empty list until it lands.
 */
export function getBttvBadges(): SanitisedBadgeSet[] {
  if (
    bttvBadgesGuard.shouldFetch(BTTV_BADGES_KEY) &&
    Date.now() >= nextRetryAt
  ) {
    loadBttvBadges();
  }

  return cachedBadges;
}
