import type { BadgeData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { buildSevenTvBadgeImageUrl } from './build-seven-tv-badge-image-url';
import { get7TvCosmeticId } from './get7-tv-cosmetic-id';
import { normalizeSevenTvBadge } from './normalize-seven-tv-badge';

export function sanitise7TvBadge(
  badgeData: BadgeData & { ref_id?: string },
  id?: string,
): SanitisedBadgeSet {
  const badgeId = id ?? get7TvCosmeticId(badgeData);

  return normalizeSevenTvBadge({
    id: badgeId,
    url: buildSevenTvBadgeImageUrl(badgeId, badgeData.host),
    type: '7TV Badge' as const,
    title: badgeData.tooltip || badgeData.name,
    set: badgeId,
    provider: '7tv',
  });
}
