import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { findBadges } from '../findBadges';

describe('findBadges', () => {
  describe('twitch', () => {
    test.each(twitchSanitisedGlobalBadges)(
      'Should find global badge %s',
      badge => {
        const userstate: UserStateTags = {
          'badges-raw': `${badge.set}/${badge.id.split('_').pop()}`,
          badges: {
            [badge.set]: badge.id.split('_').pop(),
          },
          'user-id': '123456789',
          username: 'testuser',
          'display-name': 'TestUser',
          color: '#FF0000',
          mod: 'false',
          subscriber: 'false',
          turbo: 'false',
          'user-type': '',
          'reply-parent-display-name': '',
          'reply-parent-msg-body': '',
          'reply-parent-msg-id': '',
          'reply-parent-user-login': '',
        };

        const result = findBadges({
          twitchGlobalBadges: twitchSanitisedGlobalBadges,
          chatterinoBadges: [],
          chatUsers: [],
          ffzChannelBadges: [],
          ffzGlobalBadges: [],
          twitchChannelBadges: [],
          userstate,
        });

        expect(result).toEqual<SanitisedBadgeSet[]>([
          {
            id: badge.id,
            title: badge.title,
            url: badge.url,
            type: badge.type,
            set: badge.set,
            color: badge.color,
            owner_username: badge.owner_username,
          },
        ]);
      },
    );

    test.each(twitchSanitisedChannelBadges)(
      'should find channel badge %s',
      badge => {
        const userstate: UserStateTags = {
          'badges-raw': `${badge.set}/${badge.id.split('_').pop()}`,
          badges: {
            [badge.set]: badge.id.split('_').pop(),
          },
          'user-id': '123456789',
          username: 'testuser',
          'display-name': 'TestUser',
          color: '#FF0000',
          mod: 'false',
          subscriber: 'false',
          turbo: 'false',
          'user-type': '',
          'reply-parent-display-name': '',
          'reply-parent-msg-body': '',
          'reply-parent-msg-id': '',
          'reply-parent-user-login': '',
        };

        const result = findBadges({
          twitchGlobalBadges: [],
          chatterinoBadges: [],
          chatUsers: [],
          ffzChannelBadges: [],
          ffzGlobalBadges: [],
          twitchChannelBadges: twitchSanitisedChannelBadges,
          userstate,
        });

        expect(result).toEqual<SanitisedBadgeSet[]>([
          {
            id: badge.id,
            title: badge.title,
            url: badge.url,
            type: badge.type,
            set: badge.set,
            color: badge.color,
            owner_username: badge.owner_username,
          },
        ]);
      },
    );

    test('uses source badges for shared chat messages', () => {
      const sourceSubscriberBadge = {
        id: '3',
        url: 'https://example.com/source-sub.png',
        type: 'Twitch Subscriber Badge',
        title: 'Source 3-Month Subscriber',
        set: 'subscriber',
      } as const;

      const targetSubscriberBadge = {
        id: '1',
        url: 'https://example.com/target-sub.png',
        type: 'Twitch Subscriber Badge',
        title: 'Target Subscriber',
        set: 'subscriber',
      } as const;

      const userstate: UserStateTags = {
        'badges-raw': 'subscriber/1',
        'room-id': 'target-room',
        'source-room-id': 'source-room',
        'source-badges': 'subscriber/3',
        badges: {
          subscriber: '1',
        },
        'user-id': '123456789',
        username: 'testuser',
        'display-name': 'TestUser',
        color: '#FF0000',
        mod: 'false',
        subscriber: 'false',
        turbo: 'false',
        'user-type': '',
        'reply-parent-display-name': '',
        'reply-parent-msg-body': '',
        'reply-parent-msg-id': '',
        'reply-parent-user-login': '',
      };

      const result = findBadges({
        twitchGlobalBadges: [],
        chatterinoBadges: [],
        chatUsers: [],
        ffzChannelBadges: [],
        ffzGlobalBadges: [],
        twitchChannelBadges: [targetSubscriberBadge, sourceSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([sourceSubscriberBadge]);
    });

    test('uses source badges when the source room is the current room', () => {
      const sourceSubscriberBadge = {
        id: '3',
        url: 'https://example.com/source-sub.png',
        type: 'Twitch Subscriber Badge',
        title: 'Source 3-Month Subscriber',
        set: 'subscriber',
      } as const;

      const targetSubscriberBadge = {
        id: '1',
        url: 'https://example.com/target-sub.png',
        type: 'Twitch Subscriber Badge',
        title: 'Target Subscriber',
        set: 'subscriber',
      } as const;

      const userstate: UserStateTags = {
        'badges-raw': 'subscriber/1',
        'room-id': 'source-room',
        'source-room-id': 'source-room',
        'source-badges': 'subscriber/3',
        badges: {
          subscriber: '1',
        },
        'user-id': '123456789',
        username: 'testuser',
        'display-name': 'TestUser',
        color: '#FF0000',
        mod: 'false',
        subscriber: 'false',
        turbo: 'false',
        'user-type': '',
        'reply-parent-display-name': '',
        'reply-parent-msg-body': '',
        'reply-parent-msg-id': '',
        'reply-parent-user-login': '',
      };

      const result = findBadges({
        twitchGlobalBadges: [],
        chatterinoBadges: [],
        chatUsers: [],
        ffzChannelBadges: [],
        ffzGlobalBadges: [],
        twitchChannelBadges: [targetSubscriberBadge, sourceSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([sourceSubscriberBadge]);
    });

    test('prefers one channel badge over global fallback for the same raw badge', () => {
      const channelBadge = {
        id: '1000',
        url: 'https://example.com/channel-bits.png',
        type: 'Twitch Bit Badge',
        title: 'Channel Cheer 1000',
        set: 'bits',
      } as const;

      const globalBadge = {
        id: 'bits_1000',
        url: 'https://example.com/global-bits.png',
        type: 'Twitch Global Badge',
        title: 'Global Cheer 1000',
        set: 'bits',
      } as const;

      const userstate: UserStateTags = {
        'badges-raw': 'bits/1000',
        badges: {
          bits: '1000',
        },
        'user-id': '123456789',
        username: 'testuser',
        'display-name': 'TestUser',
        color: '#FF0000',
        mod: 'false',
        subscriber: 'false',
        turbo: 'false',
        'user-type': '',
        'reply-parent-display-name': '',
        'reply-parent-msg-body': '',
        'reply-parent-msg-id': '',
        'reply-parent-user-login': '',
      };

      const result = findBadges({
        twitchGlobalBadges: [globalBadge],
        chatterinoBadges: [],
        chatUsers: [],
        ffzChannelBadges: [],
        ffzGlobalBadges: [],
        twitchChannelBadges: [channelBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([channelBadge]);
    });

    test('falls back to global subscriber badges when the channel tier has no url', () => {
      const channelSubscriberBadge = {
        id: '12',
        url: '',
        type: 'Twitch Subscriber Badge',
        title: 'Broken Channel Sub',
        set: 'subscriber',
      } as const;

      const globalSubscriberBadge = {
        id: 'subscriber_12',
        url: 'https://example.com/global-sub.png',
        type: 'Twitch Global Badge',
        title: '12-Month Subscriber',
        set: 'subscriber',
      } as const;

      const userstate: UserStateTags = {
        'badges-raw': 'subscriber/12',
        badges: {
          subscriber: '12',
        },
        'user-id': '123456789',
        username: 'testuser',
        'display-name': 'TestUser',
        color: '#FF0000',
        mod: 'false',
        subscriber: 'false',
        turbo: 'false',
        'user-type': '',
        'reply-parent-display-name': '',
        'reply-parent-msg-body': '',
        'reply-parent-msg-id': '',
        'reply-parent-user-login': '',
      };

      const result = findBadges({
        twitchGlobalBadges: [globalSubscriberBadge],
        chatterinoBadges: [],
        chatUsers: [],
        ffzChannelBadges: [],
        ffzGlobalBadges: [],
        twitchChannelBadges: [channelSubscriberBadge],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([globalSubscriberBadge]);
    });

    test('omits twitch badges when neither channel nor global urls resolve', () => {
      const userstate: UserStateTags = {
        'badges-raw': 'subscriber/12',
        badges: {
          subscriber: '12',
        },
        'user-id': '123456789',
        username: 'testuser',
        'display-name': 'TestUser',
        color: '#FF0000',
        mod: 'false',
        subscriber: 'false',
        turbo: 'false',
        'user-type': '',
        'reply-parent-display-name': '',
        'reply-parent-msg-body': '',
        'reply-parent-msg-id': '',
        'reply-parent-user-login': '',
      };

      const result = findBadges({
        twitchGlobalBadges: [],
        chatterinoBadges: [],
        chatUsers: [],
        ffzChannelBadges: [],
        ffzGlobalBadges: [],
        twitchChannelBadges: [],
        userstate,
      });

      expect(result).toEqual<SanitisedBadgeSet[]>([]);
    });
  });
});
