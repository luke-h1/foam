import type { SevenTvHost } from '@app/types/seventv/emotes';

import { badgeFileName } from './badgeFileName';
import { pickBestBadgeFile } from './pickBestBadgeFile';

const SEVEN_TV_BADGE_CDN_BASE = 'https://cdn.7tv.app/badge';

export function buildSevenTvBadgeImageUrl(
  badgeId: string,
  host?: SevenTvHost,
): string {
  const file = pickBestBadgeFile(host?.files);
  if (file && host?.url) {
    return `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`;
  }

  return `${SEVEN_TV_BADGE_CDN_BASE}/${badgeId}/4x.webp`;
}
