import type { SevenTvHost } from '@app/types/seventv/emotes';

import { badgeFileName } from './badgeFileName';
import { buildSevenTvBadgeImageUrl } from './buildSevenTvBadgeImageUrl';
import { pickBestBadgeFile } from './pickBestBadgeFile';

export function badgeUrlFromHost(host: SevenTvHost, badgeId?: string): string {
  if (badgeId) {
    return buildSevenTvBadgeImageUrl(badgeId, host);
  }

  const file = pickBestBadgeFile(host.files);
  if (file && host.url) {
    return `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`;
  }

  return host.url;
}
