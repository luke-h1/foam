import type { SevenTvHost } from '@app/services/seventv-service';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { BadgeData, PaintData } from '@app/utils/color/seventv-ws-service';

const ZERO_ID = '00000000000000000000000000';

/** Prefer 4x then 3x/2x/1x, else last/first file. */
export function badgeUrlFromHost(host: SevenTvHost): string {
  const file =
    host.files?.find((f: { name: string }) => f.name === '4x') ||
    host.files?.find((f: { name: string }) => f.name === '3x') ||
    host.files?.find((f: { name: string }) => f.name === '2x') ||
    host.files?.find((f: { name: string }) => f.name === '1x') ||
    host.files?.[host.files.length - 1] ||
    host.files?.[0];
  return file ? `${host.url}/${file.name}` : host.url;
}

export function get7TvCosmeticId(
  data: { id: string } & { ref_id?: string },
): string {
  return data.id === ZERO_ID && data.ref_id ? data.ref_id : data.id;
}

export function sanitise7TvBadge(
  badgeData: BadgeData & { ref_id?: string },
  id?: string,
): SanitisedBadgeSet {
  const badgeId = id ?? get7TvCosmeticId(badgeData);
  return {
    id: badgeId,
    url: badgeUrlFromHost(badgeData.host),
    type: '7TV Badge' as const,
    title: badgeData.tooltip || badgeData.name,
    set: badgeId,
    provider: '7tv',
  };
}

export function toPaintWithId(
  paintData: PaintData & { ref_id?: string },
): PaintData {
  return { ...paintData, id: get7TvCosmeticId(paintData) };
}
