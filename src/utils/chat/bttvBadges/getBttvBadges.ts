import { bttvEmoteService } from '@app/services/bttv-emote-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { onBadgesLoaded } from '@app/utils/chat/bttvBadges/onBadgesLoaded';
import { logger } from '@app/utils/logger';

const INITIAL_RETRY_DELAY_MS = 10_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

let cachedBadges: SanitisedBadgeSet[] = [];
let fetchStarted = false;
let retryDelayMs = INITIAL_RETRY_DELAY_MS;
let nextRetryAt = 0;

function scheduleRetry(): void {
  fetchStarted = false;
  nextRetryAt = Date.now() + retryDelayMs;
  retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
}

function loadBttvBadges(): void {
  fetchStarted = true;
  bttvEmoteService
    .getSanitisedGlobalBadges()
    .then(badges => {
      cachedBadges = badges;
      if (badges.length > 0) {
        retryDelayMs = INITIAL_RETRY_DELAY_MS;
        onBadgesLoaded.current?.();
        return;
      }
      // Empty success can be transient CDN/API flakiness — back off and retry
      // instead of sticking on fetchStarted forever with no loaded callback.
      scheduleRetry();
    })
    .catch(error => {
      scheduleRetry();
      logger.chat.warn('Failed to fetch BTTV badges', { error });
    });
}

/**
 * Synchronous accessor so the per-message badge resolver never awaits: the
 * first call kicks off the fetch and returns an empty list until it lands.
 */
export function getBttvBadges(): SanitisedBadgeSet[] {
  if (!fetchStarted && Date.now() >= nextRetryAt) {
    loadBttvBadges();
  }
  return cachedBadges;
}
