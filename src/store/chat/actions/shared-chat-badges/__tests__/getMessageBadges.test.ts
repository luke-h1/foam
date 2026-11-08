import {
  clearUserCosmeticsCache,
  setUserBadge,
} from '@app/store/chat/actions/cosmetics';
import { EMPTY_GATED_EMOTE_DATA } from '@app/store/chat/types/chat-resource-slices';
import { getPreferences, preferences$ } from '@app/store/preference-store';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

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
      getMessageBadges({ emoteData: EMPTY_GATED_EMOTE_DATA, userstate }),
    ).toEqual<SanitisedBadgeSet[]>([
      {
        id: 'badge-paint',
        provider: '7tv',
        set: 'badge-paint',
        title: '7TV Badge',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-paint/4x.webp',
      },
    ]);
  });

  test('omits the 7TV badge when badges are off', () => {
    preferences$.show7tvBadges.set(false);

    expect(
      getMessageBadges({ emoteData: EMPTY_GATED_EMOTE_DATA, userstate }),
    ).toEqual<SanitisedBadgeSet[]>([]);
  });
});
