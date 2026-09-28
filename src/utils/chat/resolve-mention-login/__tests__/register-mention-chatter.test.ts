import { clearMentionLoginIndex } from '../clear-mention-login-index';
import { getAllMentionChatters } from '../get-all-mention-chatters';
import { registerMentionChatter } from '../register-mention-chatter';
import type { MentionChatter } from '../types';

describe('registerMentionChatter', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('registerMentionChatter keeps the last known role when re-registered without one', () => {
    registerMentionChatter({
      login: 'a_mod',
      userId: '2',
      color: '#00ff00',
      role: 'moderator',
    });

    registerMentionChatter({ login: 'a_mod' });

    expect(getAllMentionChatters()).toEqual<MentionChatter[]>([
      { login: 'a_mod', userId: '2', color: '#00ff00', role: 'moderator' },
    ]);
  });
});
