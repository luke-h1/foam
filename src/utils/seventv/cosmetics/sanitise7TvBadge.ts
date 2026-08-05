import type { BadgeData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { buildSevenTvBadgeImageUrl } from './buildSevenTvBadgeImageUrl';
import { get7TvCosmeticId } from './get7TvCosmeticId';
import { normalizeSevenTvBadge } from './normalizeSevenTvBadge';

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
