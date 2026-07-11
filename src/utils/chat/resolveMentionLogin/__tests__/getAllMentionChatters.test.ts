import { clearMentionLoginIndex } from '../clearMentionLoginIndex';
import { getAllMentionChatters } from '../getAllMentionChatters';
import { registerMentionChatter } from '../registerMentionChatter';
import type { MentionChatter } from '../types';

describe('getAllMentionChatters', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('getAllMentionChatters returns every registered chatter with roles', () => {
    registerMentionChatter({
      login: 'streamer',
      userId: '1',
      color: '#ff0000',
      role: 'broadcaster',
    });
    registerMentionChatter({
      login: 'a_mod',
      userId: '2',
      color: '#00ff00',
      role: 'moderator',
    });
    registerMentionChatter({
      login: 'viewer',
      userId: '3',
      color: '#0000ff',
    });

    const chatters = getAllMentionChatters().sort((left, right) =>
      left.login.localeCompare(right.login),
    );

    expect(chatters).toEqual<MentionChatter[]>([
      { login: 'a_mod', userId: '2', color: '#00ff00', role: 'moderator' },
      { login: 'streamer', userId: '1', color: '#ff0000', role: 'broadcaster' },
      { login: 'viewer', userId: '3', color: '#0000ff', role: undefined },
    ]);
  });
});
