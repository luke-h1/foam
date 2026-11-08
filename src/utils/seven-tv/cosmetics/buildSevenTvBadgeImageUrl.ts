import type { SevenTvHost } from '@app/types/seven-tv/emotes';
import { buildSevenTvBadgeUrl } from '@app/utils/emote/cdn/sevenTv';

import { absoluteSevenTvUrl } from './absoluteSevenTvUrl';
import { badgeFileName } from './badgeFileName';
import { pickBestBadgeFile } from './pickBestBadgeFile';

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

  return buildSevenTvBadgeUrl(badgeId);
}
