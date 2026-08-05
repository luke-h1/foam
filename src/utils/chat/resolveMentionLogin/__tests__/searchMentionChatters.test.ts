import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';

import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { registerMentionChatter } from '../registerMentionChatter';
import { registerMentionLogin } from '../registerMentionLogin';
import { searchMentionChatters } from '../searchMentionChatters';
import type { MentionChatter } from '../types';

describe('searchMentionChatters', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('searchMentionChatters returns canonical logins for composer autocomplete', () => {
    registerMentionChatter({
      login: 'VelvetFathom93',
      userId: '123',
      color: '#9147ff',
    });
    registerMentionLogin('SomeOtherUser');

    expect(searchMentionChatters('vel', 5)).toEqual<MentionChatter[]>([
      {
        login: 'VelvetFathom93',
        userId: '123',
        color: '#9147ff',
      },
    ]);
    expect(searchMentionChatters('some', 5)).toEqual<MentionChatter[]>([
      {
        login: 'SomeOtherUser',
        userId: 'someotheruser',
        color: generateRandomTwitchColor('SomeOtherUser'),
      },
    ]);
  });

  /**
   * `aaabob` sorts first alphabetically but only matches mid-login, so
   * alphabetical order alone cannot produce this result.
   */
  test('ranks prefix matches above substring matches', () => {
    registerMentionLogin('aaabob');
    registerMentionLogin('bobby');

    expect(
      searchMentionChatters('bob', 5).map(chatter => chatter.login),
    ).toEqual(['bobby', 'aaabob']);
  });

  /**
   * `Zephyr` sorts before `apple` by character code and after it case
   * insensitively, so this fails if ordering reads the canonical login.
   */
  test('orders matches case-insensitively', () => {
    registerMentionLogin('Zephyr');
    registerMentionLogin('apple');

    expect(searchMentionChatters('p', 5).map(chatter => chatter.login)).toEqual(
      ['apple', 'Zephyr'],
    );
  });

  test('caps results at the requested limit', () => {
    for (let i = 0; i < 10; i += 1) {
      registerMentionLogin(`capped${i}`);
    }

    expect(searchMentionChatters('capped', 3)).toHaveLength(3);
  });

  test('prefers a registered chatter over a login-only entry', () => {
    registerMentionLogin('dupe');
    registerMentionChatter({ login: 'Dupe', userId: '42', color: '#9147ff' });

    expect(searchMentionChatters('dupe', 5)).toEqual<MentionChatter[]>([
      { login: 'Dupe', userId: '42', color: '#9147ff' },
    ]);
  });
});
