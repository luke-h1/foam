import { bttvEmoteService } from '@app/services/bttv-emote-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

let cachedBadges: SanitisedBadgeSet[] = [];
let fetchStarted = false;
let onBadgesLoaded: (() => void) | null = null;

export function setOnBttvBadgesLoaded(callback: () => void): void {
  onBadgesLoaded = callback;
}

function loadBttvBadges(): void {
  fetchStarted = true;
  bttvEmoteService
    .getSanitisedGlobalBadges()
    .then(badges => {
      cachedBadges = badges;
      if (badges.length > 0) {
        onBadgesLoaded?.();
      }
    })
    .catch(error => {
      // Reset so a later read retries instead of being stuck on the empty list.
      fetchStarted = false;
      logger.chat.warn('Failed to fetch BTTV badges', { error });
    });
}

/**
 * Synchronous accessor so the per-message badge resolver never awaits: the
 * first call kicks off the fetch and returns an empty list until it lands.
 */
export function getBttvBadges(): SanitisedBadgeSet[] {
  if (!fetchStarted) {
    loadBttvBadges();
  }
  return cachedBadges;
}
