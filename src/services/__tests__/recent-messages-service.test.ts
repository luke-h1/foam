import { parseIrcMessage } from '../recent-messages-service';

describe('recent-messages-service', () => {
  test('parses tagged PRIVMSG lines without a trailing marker', () => {
    const parsed = parseIrcMessage(
      '@display-name=icelys;id=msg-1;historical=1 :icelys!icelys@icelys.tmi.twitch.tv PRIVMSG #pajlada FeelsBadMan',
    );

    expect(parsed).toEqual({
      tags: {
        'display-name': 'icelys',
        id: 'msg-1',
        historical: '1',
      },
      prefix: 'icelys!icelys@icelys.tmi.twitch.tv',
      command: 'PRIVMSG',
      params: ['#pajlada', 'FeelsBadMan'],
    });
  });

  test('parses tagged PRIVMSG lines with a trailing message', () => {
    const parsed = parseIrcMessage(
      '@display-name=TestUser;id=msg-2 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #foam :hello chat',
    );

    expect(parsed?.command).toBe('PRIVMSG');
    expect(parsed?.params).toEqual(['#foam', 'hello chat']);
  });
});
