import type {
  BadgeProvider,
  SanitisedBadgeSet,
  SanitisedBadgeType,
} from '@app/types/twitch/badge';

export interface BadgeSource {
  id: string;
  url: string;
  title: string;
  set: string;
  type: SanitisedBadgeType;
  provider: BadgeProvider;
  color?: string;
  ownerUsername?: string;
}

export function buildSanitisedBadge({
  id,
  url,
  title,
  set,
  type,
  provider,
  color,
  ownerUsername,
}: BadgeSource): SanitisedBadgeSet {
  const badge: SanitisedBadgeSet = { id, url, title, set, type, provider };

  if (color !== undefined) {
    badge.color = color;
  }

  if (ownerUsername !== undefined) {
    badge.owner_username = ownerUsername;
  }

  return badge;
}
