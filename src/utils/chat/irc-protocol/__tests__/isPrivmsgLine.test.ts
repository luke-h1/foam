import { isPrivmsgLine } from '../isPrivmsgLine';
import { parseIrcMessage } from '../parseIrcMessage';

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

  test('agrees with parseIrcMessage on leading and doubled spaces', () => {
    const lines = [
      '  PRIVMSG #chan :hi',
      '@id=1  :user!user@user.tmi.twitch.tv  PRIVMSG #chan :hi',
    ];

    expect(lines.map(isPrivmsgLine)).toEqual(
      lines.map(line => parseIrcMessage(line)?.command === 'PRIVMSG'),
    );
  });
});
