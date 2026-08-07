import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { absoluteSevenTvUrl } from './absoluteSevenTvUrl';
import { buildSevenTvBadgeImageUrl } from './buildSevenTvBadgeImageUrl';

/**
 * Hoisted so the hot path reuses one compiled pattern; a literal inside the
 * function is a fresh RegExp on every call.
 */
const BADGE_IMAGE_EXTENSION = /\.(webp|png|avif|gif|jpe?g)(?:$|\?)/i;

/**
 * Every chat row normalises each of its badges on every render, and the result
 * depends only on the badge object. WeakMap-keyed so entries drop with the
 * badge; no eviction needed.
 */
const normalizedBadges = new WeakMap<SanitisedBadgeSet, SanitisedBadgeSet>();

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
    BADGE_IMAGE_EXTENSION.test(url)
  );
}

function computeNormalizedSevenTvBadge(
  badge: SanitisedBadgeSet,
): SanitisedBadgeSet {
  if (!isSevenTvBadge(badge) || !badge.id) {
    return badge;
  }

  const url = absoluteSevenTvUrl(badge.url);
  if (isLoadableBadgeUrl(url)) {
    return url === badge.url ? badge : { ...badge, url };
  }

  return {
    ...badge,
    url: buildSevenTvBadgeImageUrl(badge.id),
  };
}

export function normalizeSevenTvBadge(
  badge: SanitisedBadgeSet,
): SanitisedBadgeSet {
  const cached = normalizedBadges.get(badge);
  if (cached !== undefined) {
    return cached;
  }

  const normalized = computeNormalizedSevenTvBadge(badge);
  normalizedBadges.set(badge, normalized);
  return normalized;
}
