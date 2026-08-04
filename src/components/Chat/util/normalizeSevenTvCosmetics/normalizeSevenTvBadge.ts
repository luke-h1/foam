import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { absoluteSevenTvUrl } from './absoluteSevenTvUrl';
import { buildSevenTvBadgeImageUrl } from './buildSevenTvBadgeImageUrl';

function isSevenTvBadge(badge: SanitisedBadgeSet): boolean {
  return badge.provider === '7tv' || badge.type === '7TV Badge';
}

/**
 * A url an image loader can actually fetch: absolute, and pointing at a badge
 * file rather than a bare CDN directory.
 */
function isLoadableBadgeUrl(url: string): boolean {
  return (
    url.startsWith('https://') &&
    url.includes('/badge/') &&
    /\.(webp|png|avif|gif|jpe?g)(?:$|\?)/i.test(url)
  );
}

export function normalizeSevenTvBadge(
  badge: SanitisedBadgeSet,
): SanitisedBadgeSet {
  if (!isSevenTvBadge(badge) || !badge.id) {
    return badge;
  }

  // Repaired rather than rejected, so a cached badge keeps its file and scale.
  const url = absoluteSevenTvUrl(badge.url);
  if (isLoadableBadgeUrl(url)) {
    return url === badge.url ? badge : { ...badge, url };
  }

  return {
    ...badge,
    url: buildSevenTvBadgeImageUrl(badge.id),
  };
}
