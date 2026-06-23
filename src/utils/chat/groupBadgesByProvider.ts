import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export type BadgeRow = SanitisedBadgeSet[];

export interface BadgeProviderSection {
  key: string;
  title: string;
  data: BadgeRow[];
}

type BadgeProviderKey = 'twitch' | 'seventv' | 'bttv' | 'ffz';

const PROVIDER_ORDER: BadgeProviderKey[] = ['twitch', 'seventv', 'bttv', 'ffz'];

const PROVIDER_TITLES: Record<BadgeProviderKey, string> = {
  twitch: 'Twitch',
  seventv: '7TV',
  bttv: 'BetterTTV',
  ffz: 'FrankerFaceZ',
};

function providerOf(badge: SanitisedBadgeSet): BadgeProviderKey {
  switch (badge.provider) {
    case '7tv':
      return 'seventv';
    case 'bttv':
      return 'bttv';
    case 'ffz':
      return 'ffz';
    default:
      if (badge.type.startsWith('FFZ')) {
        return 'ffz';
      }
      if (badge.type.startsWith('7TV')) {
        return 'seventv';
      }
      return 'twitch';
  }
}

export function groupBadgesByProvider(
  badges: SanitisedBadgeSet[],
  columns: number,
): BadgeProviderSection[] {
  const grouped = new Map<BadgeProviderKey, SanitisedBadgeSet[]>();

  for (const badge of badges) {
    const key = providerOf(badge);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(badge);
    } else {
      grouped.set(key, [badge]);
    }
  }

  const sections: BadgeProviderSection[] = [];

  for (const key of PROVIDER_ORDER) {
    const items = grouped.get(key);
    if (!items) {
      continue;
    }
    const rows: BadgeRow[] = [];
    for (let index = 0; index < items.length; index += columns) {
      rows.push(items.slice(index, index + columns));
    }
    sections.push({ key, title: PROVIDER_TITLES[key], data: rows });
  }

  return sections;
}
