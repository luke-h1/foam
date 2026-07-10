import { bttvEmoteService } from '@app/services/bttv-emote-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

/**
 * BTTV publishes one global list of user badges (developer, supporter, etc.),
 * each keyed to its owner's Twitch user id. Unlike the per-channel badge sets,
 * it is fetched once and cached for the app session (like the bundled
 * Chatterino table). getBttvBadges() stays synchronous so the per-message badge
 * resolver never awaits: the first call kicks off the fetch and returns an empty
 * list until it lands, after which BTTV badges start resolving.
 */
let cachedBadges: SanitisedBadgeSet[] = [];
let fetchStarted = false;

function loadBttvBadges(): void {
  fetchStarted = true;
  bttvEmoteService
    .getSanitisedGlobalBadges()
    .then(badges => {
      cachedBadges = badges;
    })
    .catch(error => {
      // BTTV badges are cosmetic, so a fetch miss is non-fatal; clear the flag
      // so a later read retries instead of being stuck on the empty list.
      fetchStarted = false;
      logger.chat.warn('Failed to fetch BTTV badges', { error });
    });
}

export function getBttvBadges(): SanitisedBadgeSet[] {
  if (!fetchStarted) {
    loadBttvBadges();
  }
  return cachedBadges;
}
