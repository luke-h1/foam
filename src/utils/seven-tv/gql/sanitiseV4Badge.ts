import type { Image } from '@app/graphql/generated/gql';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { buildSanitisedBadge } from '@app/utils/emote/sanitised/buildSanitisedBadge';
import { buildSevenTvBadgeImageUrl } from '@app/utils/seven-tv/cosmetics/buildSevenTvBadgeImageUrl';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalizeSevenTvBadge';
import { pickBestImage } from '@app/utils/seven-tv/gql/pickBestImage';

interface V4BadgeFields {
  id: string;
  name: string;
  description?: string | null;
  images: readonly Image[];
}

export function sanitiseV4Badge(badge: V4BadgeFields): SanitisedBadgeSet {
  return normalizeSevenTvBadge(
    buildSanitisedBadge({
      id: badge.id,
      url:
        pickBestImage(badge.images)?.url ?? buildSevenTvBadgeImageUrl(badge.id),
      type: '7TV Badge',
      title: badge.description || badge.name,
      set: badge.id,
      provider: '7tv',
    }),
  );
}
