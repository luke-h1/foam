import type { SevenTvHost } from '@app/types/seventv/emotes';

import { badgeFileName } from './badgeFileName';
import { ensureHttpsUrl } from './ensureHttpsUrl';
import { pickBestBadgeFile } from './pickBestBadgeFile';

const SEVEN_TV_BADGE_CDN_BASE = 'https://cdn.7tv.app/badge';

export function buildSevenTvBadgeImageUrl(
  badgeId: string,
  host?: SevenTvHost,
): string {
  const file = pickBestBadgeFile(host?.files);
  if (file && host?.url) {
    const url = ensureHttpsUrl(
      `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`,
    );
    if (url) {
      return url;
    }
  }

  return `${SEVEN_TV_BADGE_CDN_BASE}/${badgeId}/4x.webp`;
}
