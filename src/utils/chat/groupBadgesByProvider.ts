import { PROVIDER_DESCRIPTORS } from '@app/constants/emote-providers';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { chunk } from '@app/utils/collection/chunk';

export type BadgeRow = SanitisedBadgeSet[];

export interface BadgeProviderSection {
  key: string;
  title: string;
  data: BadgeRow[];
}

type BadgeProviderKey = 'twitch' | '7tv' | 'bttv' | 'ffz';

const PROVIDER_ORDER: BadgeProviderKey[] = ['twitch', '7tv', 'bttv', 'ffz'];

function providerOf(badge: SanitisedBadgeSet): BadgeProviderKey {
  return badge.provider === 'chatterino' ? 'twitch' : badge.provider;
}

export function groupBadgesByProvider(
  badges: SanitisedBadgeSet[],
  columns: number,
): BadgeProviderSection[] {
  const columnsPerRow = Math.max(1, columns);
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

    const rows: BadgeRow[] = chunk(items, columnsPerRow);

    sections.push({
      key,
      title: PROVIDER_DESCRIPTORS[key].fullName,
      data: rows,
    });
  }

  return sections;
}
