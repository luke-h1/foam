import { clearMentionIndexes } from '../clearMentionIndexes';
import { getAllMentionChatters } from '../getAllMentionChatters';
import { registerMentionChatter } from '../registerMentionChatter';
import type { MentionChatter } from '../types';

describe('registerMentionChatter', () => {
  beforeEach(() => {
    clearMentionIndexes();
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

  test('stores no user id for a chatter known only from a mention', () => {
    registerMentionChatter({ login: 'MentionOnly', color: '#123456' });

    expect(getAllMentionChatters()).toEqual<MentionChatter[]>([
      { login: 'MentionOnly', color: '#123456' },
    ]);
  });
});
