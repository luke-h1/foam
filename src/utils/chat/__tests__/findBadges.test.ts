import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
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

        expect(result).toEqual([
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

        expect(result).toEqual([
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
  });
});
