import {
  formatIrcChannelName,
  formatIrcCommand,
  isSameIrcChannel,
} from '../formatIrcCommand';

describe('formatIrcCommand', () => {
  test('sends a bare command when there are no params', () => {
    expect(formatIrcCommand('PING', [])).toEqual('PING');
  });

  test('joins single-word params with spaces', () => {
    expect(formatIrcCommand('JOIN', ['#channel'])).toEqual('JOIN #channel');

    expect(formatIrcCommand('PONG', ['tmi.twitch.tv'])).toEqual(
      'PONG tmi.twitch.tv',
    );
  });

  test('makes a last param with a space a trailing param', () => {
    expect(formatIrcCommand('PRIVMSG', ['#channel', 'hello there'])).toEqual(
      'PRIVMSG #channel :hello there',
    );
  });

  test('keeps a single-word last param as a middle param', () => {
    expect(formatIrcCommand('PRIVMSG', ['#channel', 'hello'])).toEqual(
      'PRIVMSG #channel hello',
    );
  });

  test('drops empty params before the last one', () => {
    expect(formatIrcCommand('CAP', ['REQ', '', 'a b'])).toEqual('CAP REQ :a b');
  });
});

describe('formatIrcChannelName', () => {
  test('adds the leading # only when it is missing', () => {
    expect(formatIrcChannelName('channel')).toEqual('#channel');

    expect(formatIrcChannelName('#channel')).toEqual('#channel');
  });
});

describe('isSameIrcChannel', () => {
  test('ignores case and the leading #', () => {
    expect(isSameIrcChannel('#Channel', 'channel')).toBe(true);

    expect(isSameIrcChannel('channel', '#CHANNEL')).toBe(true);
  });

  test('tells two channels apart', () => {
    expect(isSameIrcChannel('#old', 'new')).toBe(false);
  });
});
