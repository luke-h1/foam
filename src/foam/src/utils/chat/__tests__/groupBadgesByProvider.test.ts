import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

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
    const sections = groupBadgesByProvider(
      [
        badge({ id: 'ffz-1', type: 'FFZ Badge', provider: 'ffz' }),
        badge({ id: 'twitch-1', type: 'Twitch Global Badge' }),
        badge({ id: 'stv-1', type: '7TV Badge', provider: '7tv' }),
      ],
      5,
    );

    expect(sections.map(section => section.title)).toEqual([
      'Twitch',
      '7TV',
      'FrankerFaceZ',
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
    expect(groupBadgesByProvider([], 5)).toEqual([]);
  });
});
