import type { ParsedIrcMessage } from '@app/types/chat/recentMessages';

import { parseIrcMessage } from '../recent-messages-service';

describe('recent-messages-service', () => {
  test('parses tagged PRIVMSG lines without a trailing marker', () => {
    const parsed = parseIrcMessage(
      '@display-name=icelys;id=msg-1;historical=1 :icelys!icelys@icelys.tmi.twitch.tv PRIVMSG #pajlada FeelsBadMan',
    );

    expect(parsed).toEqual<ParsedIrcMessage>({
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

  test('parses IRC tag flags and ignores empty tag keys', () => {
    const parsed = parseIrcMessage('@historical;=ignored;id=msg-3 PING');

    expect(parsed).toEqual<ParsedIrcMessage>({
      tags: {
        historical: '',
        id: 'msg-3',
      },
      prefix: undefined,
      command: 'PING',
      params: [],
    });
  });

  test('returns null for empty or malformed IRC lines', () => {
    expect(parseIrcMessage('')).toBeNull();
    expect(parseIrcMessage('@display-name=TestUser')).toBeNull();
    expect(parseIrcMessage(':testuser')).toBeNull();
  });
});
