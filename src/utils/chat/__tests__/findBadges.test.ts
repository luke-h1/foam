import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__/badges/twitch/twitch-sanitised-channel-badges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitch-sanitised-global-badges.fixture';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { findBadges } from '../findBadges';

const noBadges: SanitisedBadgeSet[] = [];

const emptyBadgeSources = {
  bttvBadges: noBadges,
  chatterinoBadges: noBadges,
  ffzChannelBadges: noBadges,
  ffzGlobalBadges: noBadges,
  getEntitledBadge: () => null,
};

describe('findBadges', () => {
  describe('twitch', () => {
    const sourceSubscriberBadge: SanitisedBadgeSet = {
      id: '3',
      url: 'https://example.com/source-sub.png',
      type: 'Twitch Subscriber Badge',
      provider: 'twitch',
      title: 'Source 3-Month Subscriber',
      set: 'subscriber',
    };

    const targetSubscriberBadge: SanitisedBadgeSet = {
      id: '1',
      url: 'https://example.com/target-sub.png',
      type: 'Twitch Subscriber Badge',
      provider: 'twitch',
      title: 'Target Subscriber',
      set: 'subscriber',
    };

    test('finds a global badge by its set and version', () => {
      const userstate = createUserStateTags({
        'badges-raw': '60-seconds_2/1',
        badges: { '60-seconds_2': '1' },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: twitchSanitisedGlobalBadges,
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([
        {
          id: '60-seconds_2_1',
          url: 'https://static-cdn.jtvnw.net/badges/v1/64513f7d-21dd-4a05-a699-d73761945cf9/3',
          title: '60 Seconds!',
          type: 'Twitch Global Badge',
          provider: 'twitch',
          set: '60-seconds_2',
        },
      ]);
    });

    test('finds a channel badge by its set and version', () => {
      const userstate = createUserStateTags({
        'badges-raw': 'subscriber/12',
        badges: { subscriber: '12' },
        'user-id': '123456789',
      });

      const result = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: [],
        twitchChannelBadges: twitchSanitisedChannelBadges,
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([
        {
          id: '12',
          url: 'https://static-cdn.jtvnw.net/badges/v1/04d8e164-a4ff-49a2-889a-d53ff7a00c90/3',
          type: 'Twitch Subscriber Badge',
          provider: 'twitch',
          title: '1-Year Subscriber',
          set: 'subscriber',
        },
      ]);
    });

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

    test('prefers one channel badge over global fallback for the same raw badge', () => {
      const channelBadge: SanitisedBadgeSet = {
        id: '1000',
        url: 'https://example.com/channel-bits.png',
        type: 'Twitch Bit Badge',
        provider: 'twitch',
        title: 'Channel Cheer 1000',
        set: 'bits',
      };

      const globalBadge: SanitisedBadgeSet = {
        id: 'bits_1000',
        url: 'https://example.com/global-bits.png',
        type: 'Twitch Global Badge',
        provider: 'twitch',
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
        provider: 'twitch',
        title: 'Broken Channel Sub',
        set: 'subscriber',
      };

      const globalSubscriberBadge: SanitisedBadgeSet = {
        id: 'subscriber_12',
        url: 'https://example.com/global-sub.png',
        type: 'Twitch Global Badge',
        provider: 'twitch',
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
      type: 'FFZ Channel Badge',
      provider: 'ffz',
    };

    const ffzVipBadge: SanitisedBadgeSet = {
      id: 'vip_badge',
      url: 'https://example.com/ffz-vip.png',
      title: 'VIP',
      color: '#ff0000',
      owner_username: 'channel-id',
      set: 'vip',
      type: 'FFZ Channel Badge',
      provider: 'ffz',
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
            provider: 'twitch',
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
        provider: 'twitch',
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

  test('finds an FFZ global badge by the sender login, not the display name', () => {
    const ffzBadge: SanitisedBadgeSet = {
      id: 'ffz-supporter',
      url: 'https://example.com/ffz.png',
      type: 'FFZ Global Badge',
      provider: 'ffz',
      title: 'Supporter',
      set: 'ffz-supporter',
      owner_username: 'luke_h',
    };

    const result = findBadges({
      ...emptyBadgeSources,
      ffzGlobalBadges: [ffzBadge],
      twitchGlobalBadges: [],
      twitchChannelBadges: [],
      userstate: createUserStateTags({
        login: 'luke_h',
        username: 'ルーク',
        'display-name': 'ルーク',
      }),
    });

    expect(result).toEqual<SanitisedBadgeSet[]>([ffzBadge]);
  });

  describe('badge tag cache', () => {
    const subscriberUserstate = createUserStateTags({
      'badges-raw': 'subscriber/12',
      badges: { subscriber: '12' },
      'user-id': 'cache-user',
    });

    const channelBadge: SanitisedBadgeSet = {
      id: '12',
      url: 'https://example.com/sub-12.png',
      type: 'Twitch Subscriber Badge',
      provider: 'twitch',
      title: 'Subscriber',
      set: 'subscriber',
    };

    const entitledBadge: SanitisedBadgeSet = {
      id: '7tv-1',
      url: 'https://cdn.7tv.app/badge/7tv-1/3x.webp',
      type: '7TV Badge',
      provider: '7tv',
      title: '7TV',
      set: '7tv',
    };

    test('repeat messages with one badge tag share one result', () => {
      const channelBadges = [channelBadge];

      const lookup = () =>
        findBadges({
          ...emptyBadgeSources,
          twitchGlobalBadges: noBadges,
          twitchChannelBadges: channelBadges,
          userstate: subscriberUserstate,
        });

      expect(lookup()).toBe(lookup());
    });

    test('a new badge collection rebuilds the result for the same tag', () => {
      const first = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: noBadges,
        twitchChannelBadges: [channelBadge],
        userstate: subscriberUserstate,
      });

      const second = findBadges({
        ...emptyBadgeSources,
        twitchGlobalBadges: noBadges,
        twitchChannelBadges: [{ ...channelBadge, title: 'Renamed' }],
        userstate: subscriberUserstate,
      });

      expect([first, second].map(badges => badges[0]?.title)).toEqual([
        'Subscriber',
        'Renamed',
      ]);
    });

    test('an entitlement change shows on the next message with the same tag', () => {
      const channelBadges = [channelBadge];
      let entitled: SanitisedBadgeSet | null = null;

      const lookup = () =>
        findBadges({
          ...emptyBadgeSources,
          getEntitledBadge: () => entitled,
          twitchGlobalBadges: noBadges,
          twitchChannelBadges: channelBadges,
          userstate: subscriberUserstate,
        }).map(badge => badge.id);

      const before = lookup();
      entitled = entitledBadge;
      const after = lookup();

      expect({ before, after }).toEqual({
        before: ['12'],
        after: ['12', '7tv-1'],
      });
    });
  });
});
