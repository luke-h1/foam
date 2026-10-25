import {
  clearUserCosmeticsCache,
  setUserBadge,
} from '@app/store/chat/actions/cosmetics';
import { emptyResolvedEmoteData } from '@app/store/chat/types/constants';
import { getPreferences, preferences$ } from '@app/store/preference-store';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { buildSevenTvBadgeImageUrl } from '@app/utils/seven-tv/cosmetics/buildSevenTvBadgeImageUrl';

import { getMessageBadges } from '../getMessageBadges';

const userstate = createUserStateTags({ 'user-id': 'ttv-paint' });

describe('getMessageBadges', () => {
  const show7tvBadges = getPreferences().show7tvBadges;

  beforeEach(() => {
    clearUserCosmeticsCache();
    setUserBadge('ttv-paint', 'badge-paint');
  });

  afterEach(() => {
    preferences$.show7tvBadges.set(show7tvBadges);
    clearUserCosmeticsCache();
  });

  test('includes the 7TV badge when badges are on', () => {
    preferences$.show7tvBadges.set(true);

    expect(
      getMessageBadges({ emoteData: emptyResolvedEmoteData, userstate }),
    ).toEqual<SanitisedBadgeSet[]>([
      {
        id: 'badge-paint',
        provider: '7tv',
        set: 'badge-paint',
        title: '7TV Badge',
        type: '7TV Badge',
        url: buildSevenTvBadgeImageUrl('badge-paint'),
      },
    ]);
  });

  test('omits the 7TV badge when badges are off', () => {
    preferences$.show7tvBadges.set(false);

    expect(
      getMessageBadges({ emoteData: emptyResolvedEmoteData, userstate }),
    ).toEqual<SanitisedBadgeSet[]>([]);
  });
});
