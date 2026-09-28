import { chatterinoService } from '@app/services/chatterino-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

let cachedBadges: SanitisedBadgeSet[] | null = null;

export function getChatterinoBadges(): SanitisedBadgeSet[] {
  cachedBadges ??= chatterinoService.listSanitisedBadges();
  return cachedBadges;
}
