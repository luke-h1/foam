import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { buildSevenTvBadgeImageUrl } from './buildSevenTvBadgeImageUrl';

function isSevenTvBadge(badge: SanitisedBadgeSet): boolean {
  return badge.provider === '7tv' || badge.type === '7TV Badge';
}

export function normalizeSevenTvBadge(
  badge: SanitisedBadgeSet,
): SanitisedBadgeSet {
  if (!isSevenTvBadge(badge) || !badge.id) {
    return badge;
  }

  if (
    badge.url.includes('/badge/') &&
    /\.(webp|png|avif|gif|jpe?g)(?:$|\?)/i.test(badge.url)
  ) {
    return badge;
  }

  return {
    ...badge,
    url: buildSevenTvBadgeImageUrl(badge.id),
  };
}
