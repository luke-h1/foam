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

  test('returns null for a prefix-only line', () => {
    expect(parseIrcMessage(':testuser')).toBeNull();
  });

  test('parses replayed PRIVMSG lines without a trailing marker', () => {
    expect(
      parseIrcMessage(
        '@display-name=icelys;id=msg-1;historical=1 :icelys!icelys@icelys.tmi.twitch.tv PRIVMSG #pajlada FeelsBadMan',
      ),
    ).toEqual<IrcMessage>({
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

  test('unescapes IRCv3 tag values in replayed lines', () => {
    expect(
      parseIrcMessage(
        '@msg-id=resub;system-msg=5\\smonths\\:\\sPog\\\\s :tmi.twitch.tv USERNOTICE #foam :resubbed',
      ),
    ).toEqual<IrcMessage>({
      tags: {
        'msg-id': 'resub',
        'system-msg': '5 months; Pog\\s',
      },
      prefix: 'tmi.twitch.tv',
      command: 'USERNOTICE',
      params: ['#foam', 'resubbed'],
    });
  });

  test('parses IRC tag flags and ignores empty tag keys', () => {
    expect(
      parseIrcMessage('@historical;=ignored;id=msg-3 PING'),
    ).toEqual<IrcMessage>({
      tags: {
        historical: '',
        id: 'msg-3',
      },
      prefix: undefined,
      command: 'PING',
      params: [],
    });
  });
});
