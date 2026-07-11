import type { BadgeData } from '@app/types/seventv/cosmetics';
import type { SevenTvHost } from '@app/types/seventv/emotes';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { sanitise7TvBadge } from '../sanitise7TvBadge';
import {
  makeSevenTvFile,
  makeSevenTvHost,
} from './__fixtures__/normalizeSevenTvCosmetics.fixture';

function makeBadgeData(overrides: {
  id: string;
  name: string;
  tooltip: string;
  host: SevenTvHost;
  ref_id?: string;
}): BadgeData & { ref_id?: string } {
  return {
    id: overrides.id,
    name: overrides.name,
    tooltip: overrides.tooltip,
    host: overrides.host,
    ...(overrides.ref_id !== undefined && { ref_id: overrides.ref_id }),
  };
}

describe('sanitise7TvBadge', () => {
  test('returns SanitisedBadgeSet with correct shape', () => {
    const badgeData = makeBadgeData({
      id: 'badge-id',
      name: 'Test Badge',
      tooltip: 'Tooltip text',
      host: makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
        makeSevenTvFile('4x', 72, 72),
      ]),
    });
    const result = sanitise7TvBadge(badgeData);
    expect(result).toEqual<SanitisedBadgeSet>({
      id: 'badge-id',
      url: 'https://cdn.7tv.app/badge/badge-id/4x.png',
      type: '7TV Badge',
      title: 'Tooltip text',
      set: 'badge-id',
      provider: '7tv',
    });
  });

  test('uses name when tooltip is missing', () => {
    const badgeData = makeBadgeData({
      id: 'bid',
      name: 'Badge Name',
      tooltip: '',
      host: makeSevenTvHost('https://cdn.7tv.app', []),
    });
    const result = sanitise7TvBadge(badgeData);
    expect(result.title).toBe('Badge Name');
  });

  test('uses provided id override', () => {
    const badgeData = makeBadgeData({
      id: '00000000000000000000000000',
      ref_id: 'ref-id',
      name: 'Badge',
      tooltip: '',
      host: makeSevenTvHost('https://cdn.7tv.app', []),
    });
    const result = sanitise7TvBadge(badgeData, 'custom-id');
    expect(result.id).toBe('custom-id');
    expect(result.set).toBe('custom-id');
  });
});
