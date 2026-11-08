import { initialPreferences } from '@app/store/preference-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  ALL_SLICE_KEYS,
  EMPTY_GATED_EMOTE_DATA,
  gateEmoteData,
  mapSlices,
} from '../chat-resource-slices';
import { makeEmptyEmoteData, makeEmptyGlobalCacheData } from '../constants';

const ffzBadge: SanitisedBadgeSet = {
  id: 'ffz-1',
  set: 'ffz-1',
  type: 'FFZ Global Badge',
  title: 'FFZ',
  url: 'https://example.com/ffz.png',
  provider: 'ffz',
};

describe('chat resource slices', () => {
  test('the empty cache factories hold every slice in the table', () => {
    expect(
      Object.keys({ ...makeEmptyEmoteData(), ...makeEmptyGlobalCacheData() })
        .filter(key => ALL_SLICE_KEYS.some(sliceKey => sliceKey === key))
        .toSorted(),
    ).toEqual([...ALL_SLICE_KEYS].toSorted());
  });

  test('the gate hides a slice whose preference is off', () => {
    const gated = gateEmoteData({
      slices: {
        ...mapSlices(ALL_SLICE_KEYS, () => []),
        ffzGlobalBadges: [ffzBadge],
      },
      preferences: { ...initialPreferences, showFFzBadges: false },
      chatterinoBadges: [],
      bttvBadges: [],
    });

    expect(gated.ffzGlobalBadges).toEqual([]);
  });

  test('the empty result has the same keys as a gated result', () => {
    const gated = gateEmoteData({
      slices: mapSlices(ALL_SLICE_KEYS, () => []),
      preferences: initialPreferences,
      chatterinoBadges: [],
      bttvBadges: [],
    });

    expect(Object.keys(EMPTY_GATED_EMOTE_DATA).toSorted()).toEqual(
      Object.keys(gated).toSorted(),
    );
  });
});
