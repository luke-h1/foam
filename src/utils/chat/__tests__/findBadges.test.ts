import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { findBadges } from '../findBadges';

const emptyBadgeSources = {
  bttvBadges: [] as SanitisedBadgeSet[],
  chatterinoBadges: [] as SanitisedBadgeSet[],
  ffzChannelBadges: [] as SanitisedBadgeSet[],
  ffzGlobalBadges: [] as SanitisedBadgeSet[],
};

describe('findBadges', () => {
  describe('twitch', () => {
    const sourceSubscriberBadge: SanitisedBadgeSet = {
      id: '3',
      url: 'https://example.com/source-sub.png',
      type: 'Twitch Subscriber Badge',
      title: 'Source 3-Month Subscriber',
      set: 'subscriber',
    };

    const targetSubscriberBadge: SanitisedBadgeSet = {
      id: '1',
      url: 'https://example.com/target-sub.png',
      type: 'Twitch Subscriber Badge',
      title: 'Target Subscriber',
      set: 'subscriber',
    };

    test.each(twitchSanitisedGlobalBadges)(
      'Should find global badge %s',
      badge => {
        const userstate = createUserStateTags({
          'badges-raw': `${badge.set}/${badge.id.split('_').pop()}`,
          badges: {
            [badge.set]: badge.id.split('_').pop(),
          },
          'user-id': '123456789',
        });

        const result = findBadges({
          ...emptyBadgeSources,
          twitchGlobalBadges: twitchSanitisedGlobalBadges,
          twitchChannelBadges: [],
          userstate,
        });

        expect(result).toEqual<SanitisedBadgeSet[]>([badge]);
      },
    );

    test.each(twitchSanitisedChannelBadges)(
      'should find channel badge %s',
      badge => {
        const userstate = createUserStateTags({
          'badges-raw': `${badge.set}/${badge.id.split('_').pop()}`,
          badges: {
            [badge.set]: badge.id.split('_').pop(),
          },
          'user-id': '123456789',
        });

        const result = findBadges({
          ...emptyBadgeSources,
          twitchGlobalBadges: [],
          twitchChannelBadges: twitchSanitisedChannelBadges,
          userstate,
        });

        expect(result).toEqual<SanitisedBadgeSet[]>([badge]);
      },
    );

    test('uses source badges for shared chat messages', () => {
      const userstate = createUserStateTags({
        'badges-raw': 'subscriber/1',
        'room-id': 'target-room',
        'source-room-id': 'source-room',
        'source-badges': 'subscriber/3',
        badges: {
          subscriber: '1',
        },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [],
        twitchChannelBadges: [targetSubscriberBadge, sourceSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([sourceSubscriberBadge]);
    });

    test('uses source badges when the source room is the current room', () => {
      const userstate = createUserStateTags({
        'badges-raw': 'subscriber/1',
        'room-id': 'source-room',
        'source-room-id': 'source-room',
        'source-badges': 'subscriber/3',
        badges: {
          subscriber: '1',
        },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [],
        twitchChannelBadges: [targetSubscriberBadge, sourceSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([sourceSubscriberBadge]);
    });

    test('prefers one channel badge over global fallback for the same raw badge', () => {
      const channelBadge: SanitisedBadgeSet = {
        id: '1000',
        url: 'https://example.com/channel-bits.png',
        type: 'Twitch Bit Badge',
        title: 'Channel Cheer 1000',
        set: 'bits',
      };

      const globalBadge: SanitisedBadgeSet = {
        id: 'bits_1000',
        url: 'https://example.com/global-bits.png',
        type: 'Twitch Global Badge',
        title: 'Global Cheer 1000',
        set: 'bits',
      };

      const userstate = createUserStateTags({
        'badges-raw': 'bits/1000',
        badges: {
          bits: '1000',
        },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [globalBadge],
        twitchChannelBadges: [channelBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([channelBadge]);
    });

    test('falls back to global subscriber badges when the channel tier has no url', () => {
      const channelSubscriberBadge: SanitisedBadgeSet = {
        id: '12',
        url: '',
        type: 'Twitch Subscriber Badge',
        title: 'Broken Channel Sub',
        set: 'subscriber',
      };

      const globalSubscriberBadge: SanitisedBadgeSet = {
        id: 'subscriber_12',
        url: 'https://example.com/global-sub.png',
        type: 'Twitch Global Badge',
        title: '12-Month Subscriber',
        set: 'subscriber',
      };

      const userstate = createUserStateTags({
        'badges-raw': 'subscriber/12',
        badges: {
          subscriber: '12',
        },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [globalSubscriberBadge],
        twitchChannelBadges: [channelSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([globalSubscriberBadge]);
    });

    test('omits twitch badges when neither channel nor global urls resolve', () => {
      const userstate = createUserStateTags({
        'badges-raw': 'subscriber/12',
        badges: {
          subscriber: '12',
        },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([]);
    });
  });

  describe('ffz mod/vip fallback', () => {
    const ffzModBadge: SanitisedBadgeSet = {
      id: 'mod_badge',
      url: 'https://example.com/ffz-mod.png',
      title: 'Moderator',
      color: '#1ac9a2',
      owner_username: 'channel-id',
      set: 'mod',
      type: 'FFZ channel badge',
    };

    const ffzVipBadge: SanitisedBadgeSet = {
      id: 'vip_badge',
      url: 'https://example.com/ffz-vip.png',
      title: 'VIP',
      color: '#ff0000',
      owner_username: 'channel-id',
      set: 'vip',
      type: 'FFZ channel badge',
    };

    test('replaces the Twitch moderator badge with the FFZ channel mod badge', () => {
      const userstate = createUserStateTags({
        'badges-raw': 'moderator/1',
        badges: { moderator: '1' },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        ffzChannelBadges: [ffzModBadge, ffzVipBadge],
        twitchGlobalBadges: [
          {
            id: 'moderator_1',
            url: 'https://example.com/twitch-mod.png',
            type: 'Twitch Global Badge',
            title: 'Moderator',
            set: 'moderator',
          },
        ],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([ffzModBadge]);
    });

    test('keeps the Twitch moderator badge when no FFZ mod badge exists', () => {
      const twitchModBadge: SanitisedBadgeSet = {
        id: 'moderator_1',
        url: 'https://example.com/twitch-mod.png',
        type: 'Twitch Global Badge',
        title: 'Moderator',
        set: 'moderator',
      };

      const userstate = createUserStateTags({
        'badges-raw': 'moderator/1',
        badges: { moderator: '1' },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [twitchModBadge],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([twitchModBadge]);
    });
  });

  describe('bttv', () => {
    test('appends the BTTV badge matched by the chatter user id', () => {
      const bttvBadge: SanitisedBadgeSet = {
        id: '123456789',
        url: 'https://cdn.betterttv.net/badges/developer.svg',
        title: 'NightDev Developer',
        set: 'bttv',
        type: 'BTTV Badge',
        provider: 'bttv',
      };

      const userstate = createUserStateTags({
        'badges-raw': '',
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        bttvBadges: [bttvBadge],
        twitchGlobalBadges: [],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([bttvBadge]);
    });

    test('does not add a BTTV badge for a chatter without one', () => {
      const bttvBadge: SanitisedBadgeSet = {
        id: '999',
        url: 'https://cdn.betterttv.net/badges/developer.svg',
        title: 'NightDev Developer',
        set: 'bttv',
        type: 'BTTV Badge',
        provider: 'bttv',
      };

      const userstate = createUserStateTags({
        'badges-raw': '',
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        bttvBadges: [bttvBadge],
        twitchGlobalBadges: [],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([]);
    });
  });
});
