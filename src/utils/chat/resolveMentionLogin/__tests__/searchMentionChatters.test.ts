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
      login: 'BungleXO',
      userId: '123',
      color: '#9147ff',
    });
    registerMentionLogin('SomeOtherUser');

    expect(searchMentionChatters('bun', 5)).toEqual<MentionChatter[]>([
      {
        login: 'BungleXO',
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
});
