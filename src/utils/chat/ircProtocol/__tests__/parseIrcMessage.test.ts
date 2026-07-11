import type { IrcMessage } from '../parseIrcMessage';
import { parseIrcMessage } from '../parseIrcMessage';

describe('parseIrcMessage', () => {
  test('returns null for blank lines', () => {
    expect(parseIrcMessage('')).toBeNull();
    expect(parseIrcMessage('   ')).toBeNull();
  });

  test('parses a PING with a trailing param', () => {
    expect(parseIrcMessage('PING :tmi.twitch.tv')).toEqual<IrcMessage>({
      tags: undefined,
      prefix: undefined,
      command: 'PING',
      params: ['tmi.twitch.tv'],
    });
  });

  test('parses tags, prefix, command, leading and trailing params', () => {
    expect(
      parseIrcMessage(
        '@display-name=Foo;color=#FF0000 :foo!foo@foo.tmi.twitch.tv PRIVMSG #bar :hello world',
      ),
    ).toEqual<IrcMessage>({
      tags: { 'display-name': 'Foo', color: '#FF0000' },
      prefix: 'foo!foo@foo.tmi.twitch.tv',
      command: 'PRIVMSG',
      params: ['#bar', 'hello world'],
    });
  });

  test('parses a prefixed command with no params', () => {
    expect(parseIrcMessage(':tmi.twitch.tv RECONNECT')).toEqual<IrcMessage>({
      tags: undefined,
      prefix: 'tmi.twitch.tv',
      command: 'RECONNECT',
      params: [],
    });
  });

  test('returns null for a tags-only line with no following space', () => {
    expect(parseIrcMessage('@only-tags')).toBeNull();
  });
});
