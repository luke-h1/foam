import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type { BadgeProviderSection } from '../groupBadgesByProvider';
import { groupBadgesByProvider } from '../groupBadgesByProvider';

function badge(overrides: Partial<SanitisedBadgeSet>): SanitisedBadgeSet {
  return {
    id: 'id',
    url: 'https://example.com/badge',
    title: 'Badge',
    type: 'Twitch Global Badge',
    set: 'set',
    ...overrides,
  };
}

describe('groupBadgesByProvider', () => {
  test('groups badges into provider sections in a fixed order', () => {
    const ffzBadge = badge({ id: 'ffz-1', type: 'FFZ Badge', provider: 'ffz' });
    const twitchBadge = badge({ id: 'twitch-1', type: 'Twitch Global Badge' });
    const stvBadge = badge({ id: 'stv-1', type: '7TV Badge', provider: '7tv' });

    const sections = groupBadgesByProvider(
      [ffzBadge, twitchBadge, stvBadge],
      5,
    );

    expect(sections).toEqual<BadgeProviderSection[]>([
      { key: 'twitch', title: 'Twitch', data: [[twitchBadge]] },
      { key: 'seventv', title: '7TV', data: [[stvBadge]] },
      { key: 'ffz', title: 'FrankerFaceZ', data: [[ffzBadge]] },
    ]);
  });

  test('chunks each provider into rows of the given column count', () => {
    const badges = Array.from({ length: 7 }, (_, index) =>
      badge({ id: `twitch-${index}` }),
    );

    const sections = groupBadgesByProvider(badges, 5);
    const rows = sections[0]?.data ?? [];

    expect(rows.map(row => row.length)).toEqual([5, 2]);
  });

  test('returns an empty list when there are no badges', () => {
    expect(groupBadgesByProvider([], 5)).toEqual<BadgeProviderSection[]>([]);
  });
});
