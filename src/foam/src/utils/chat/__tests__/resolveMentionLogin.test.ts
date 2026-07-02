import {
  applyMentionLoginCasing,
  clearMentionLoginIndex,
  formatMentionContent,
  getAllMentionChatters,
  getMentionLogin,
  pickCanonicalLogin,
  registerMentionChatter,
  registerMentionLogin,
  registerMentionLoginsFromSender,
  searchMentionChatters,
} from '../resolveMentionLogin';

describe('resolveMentionLogin', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('prefers login strings that preserve Twitch casing', () => {
    expect(pickCanonicalLogin('bunglexo', 'BungleXO')).toBe('BungleXO');
    expect(pickCanonicalLogin('BungleXO', 'bunglexo')).toBe('BungleXO');
  });

  test('registers display names that match login casing', () => {
    registerMentionLoginsFromSender('bunglexo', 'BungleXO');

    expect(getMentionLogin('bunglexo')).toBe('BungleXO');
    expect(formatMentionContent('@bunglexo')).toBe('@BungleXO');
  });

  test('searchMentionChatters returns canonical logins for composer autocomplete', () => {
    registerMentionChatter({
      login: 'BungleXO',
      userId: '123',
      color: '#9147ff',
    });
    registerMentionLogin('SomeOtherUser');

    expect(searchMentionChatters('bun', 5)).toEqual([
      {
        login: 'BungleXO',
        userId: '123',
        color: '#9147ff',
      },
    ]);
    expect(searchMentionChatters('some', 5)[0]?.login).toBe('SomeOtherUser');
  });

  test('applyMentionLoginCasing rewrites mention parts when canonical login is known', () => {
    registerMentionLogin('BungleXO');

    const parts = applyMentionLoginCasing([
      { type: 'mention', content: '@bunglexo' },
      { type: 'text', content: ' high hopes' },
    ]);

    expect(parts[0]).toEqual({ type: 'mention', content: '@BungleXO' });
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

    expect(chatters).toEqual([
      { login: 'a_mod', userId: '2', color: '#00ff00', role: 'moderator' },
      { login: 'streamer', userId: '1', color: '#ff0000', role: 'broadcaster' },
      { login: 'viewer', userId: '3', color: '#0000ff', role: undefined },
    ]);
  });

  test('registerMentionChatter keeps the last known role when re-registered without one', () => {
    registerMentionChatter({
      login: 'a_mod',
      userId: '2',
      color: '#00ff00',
      role: 'moderator',
    });
    registerMentionChatter({ login: 'a_mod' });

    expect(getAllMentionChatters()).toEqual([
      { login: 'a_mod', userId: '2', color: '#00ff00', role: 'moderator' },
    ]);
  });
});
