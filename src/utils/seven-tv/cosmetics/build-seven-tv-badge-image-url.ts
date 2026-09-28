import type { SevenTvHost } from '@app/types/seven-tv/emotes';

import { absoluteSevenTvUrl } from './absolute-seven-tv-url';
import { badgeFileName } from './badge-file-name';
import { pickBestBadgeFile } from './pick-best-badge-file';

const SEVEN_TV_BADGE_CDN_BASE = 'https://cdn.7tv.app/badge';

export function buildSevenTvBadgeImageUrl(
  badgeId: string,
  host?: SevenTvHost,
): string {
  const file = pickBestBadgeFile(host?.files);

  if (file && host?.url) {
    return absoluteSevenTvUrl(
      `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`,
    );
  }

  return `${SEVEN_TV_BADGE_CDN_BASE}/${badgeId}/4x.webp`;
}
