import type { IrcMessage } from '../ircProtocol';
import {
  buildPrivmsgLine,
  isPrivmsgLine,
  parseIrcMessage,
  parseIrcTags,
} from '../ircProtocol';

describe('parseIrcTags', () => {
  test('returns an empty map for an empty string', () => {
    expect(parseIrcTags('')).toEqual({});
  });

  test('parses key/value pairs', () => {
    expect(parseIrcTags('display-name=Foo;color=#FF0000')).toEqual({
      'display-name': 'Foo',
      color: '#FF0000',
    });
  });

  test('keeps empty values', () => {
    expect(parseIrcTags('badge-info=;mod=0')).toEqual({
      'badge-info': '',
      mod: '0',
    });
  });

  test('preserves "=" inside a value', () => {
    expect(parseIrcTags('emotes=25:0-4=5')).toEqual({ emotes: '25:0-4=5' });
  });

  test('unescapes IRCv3 escape sequences in values', () => {
    expect(
      parseIrcTags(
        'system-msg=ModUser\\sis\\scelebrating\\s24\\smonths\\sas\\sa\\smoderator!;msg-param-reward-title=Say\\shi\\s:)',
      ),
    ).toEqual({
      'system-msg': 'ModUser is celebrating 24 months as a moderator!',
      'msg-param-reward-title': 'Say hi :)',
    });
  });

  test('does not double-decode a literal backslash', () => {
    // Raw `\\s` is an escaped backslash followed by a literal `s`, i.e. `\s`
    // as text — not a space. A second decode pass would corrupt it to a space.
    expect(parseIrcTags('ban-reason=path\\\\sfoo')).toEqual({
      'ban-reason': 'path\\sfoo',
    });
  });

  test('leaves the structural colons in the emotes tag untouched', () => {
    expect(parseIrcTags('emotes=25:0-4,6-10/1902:12-16')).toEqual({
      emotes: '25:0-4,6-10/1902:12-16',
    });
  });
});

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

describe('isPrivmsgLine', () => {
  test('detects a tagged, prefixed PRIVMSG', () => {
    expect(
      isPrivmsgLine(
        '@badges=;color=#FF0000 :foo!foo@foo.tmi.twitch.tv PRIVMSG #bar :hello',
      ),
    ).toBe(true);
  });

  test('detects a bare PRIVMSG', () => {
    expect(isPrivmsgLine('PRIVMSG #bar :hello')).toBe(true);
  });

  test('rejects control commands', () => {
    expect(
      isPrivmsgLine('@ban-duration=600 :tmi.twitch.tv CLEARCHAT #bar :foo'),
    ).toBe(false);
    expect(isPrivmsgLine(':tmi.twitch.tv RECONNECT')).toBe(false);
  });

  test('is not fooled by PRIVMSG inside a message body', () => {
    expect(
      isPrivmsgLine(':tmi.twitch.tv NOTICE #bar :try PRIVMSG #chan :hi'),
    ).toBe(false);
  });

  test('rejects malformed tag-only lines', () => {
    expect(isPrivmsgLine('@only-tags')).toBe(false);
  });
});

describe('buildPrivmsgLine', () => {
  test('builds a plain message line', () => {
    expect(buildPrivmsgLine({ channel: '#bar', message: 'hello world' })).toBe(
      'PRIVMSG #bar :hello world',
    );
  });

  test('attaches only the reply parent id tag on replies', () => {
    expect(
      buildPrivmsgLine({
        channel: '#bar',
        message: 'hi back',
        replyParentMsgId: 'abc-123',
      }),
    ).toBe('@reply-parent-msg-id=abc-123 PRIVMSG #bar :hi back');
  });

  test('reply lines survive a round-trip through the parser', () => {
    // Regression: the display-name/body reply tags used to be sent raw, so a
    // multi-word parent body terminated the tag section at its first space and
    // the server read the rest of the body as the command.
    const line = buildPrivmsgLine({
      channel: '#bar',
      message: 'hi back',
      replyParentMsgId: 'abc-123',
    });
    expect(parseIrcMessage(line)).toEqual<IrcMessage>({
      tags: { 'reply-parent-msg-id': 'abc-123' },
      prefix: undefined,
      command: 'PRIVMSG',
      params: ['#bar', 'hi back'],
    });
  });
});
