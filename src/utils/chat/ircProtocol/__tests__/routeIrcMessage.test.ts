import { parseIrcMessage } from '../parseIrcMessage';
import type { IrcRouteHandlers } from '../routeIrcMessage';
import { routeIrcMessage } from '../routeIrcMessage';

function route(line: string, handlers: IrcRouteHandlers): void {
  const message = parseIrcMessage(line);
  expect(message).not.toBeNull();
  routeIrcMessage(message!, handlers);
}

describe('routeIrcMessage', () => {
  test('dispatches privmsg with the login repaired from the prefix', () => {
    const privmsg = jest.fn();
    route(
      '@badge-info=;display-name=Chatter;mod=0 :chatter!chatter@chatter.tmi.twitch.tv PRIVMSG #somechannel :hello world',
      { privmsg },
    );

    expect(privmsg).toHaveBeenCalledTimes(1);
    // SAFETY: the assertion above pins one recorded call, whose arguments are the privmsg handler's parameters.
    const [channel, tags, text] = privmsg.mock.calls[0] as [
      string,
      Record<string, string>,
      string,
    ];
    expect(channel).toBe('#somechannel');
    expect(text).toBe('hello world');
    expect(tags.login).toBe('chatter');
    expect(tags['display-name']).toBe('Chatter');
  });

  test('keeps an existing login tag over the prefix nick', () => {
    const privmsg = jest.fn();
    route(
      '@login=canonical :other!other@other.tmi.twitch.tv PRIVMSG #somechannel :hi',
      { privmsg },
    );

    // SAFETY: the route above dispatched one privmsg, whose arguments are the handler's parameters.
    const [, tags] = privmsg.mock.calls[0] as [string, Record<string, string>];
    expect(tags.login).toBe('canonical');
  });

  test('drops a privmsg without tags', () => {
    const privmsg = jest.fn();
    const unhandled = jest.fn();
    route(':nick!nick@nick.tmi.twitch.tv PRIVMSG #somechannel :hi', {
      privmsg,
      unhandled,
    });

    expect(privmsg).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  test('dispatches usernotice with an empty text default', () => {
    const usernotice = jest.fn();
    route('@msg-id=sub;login=subber USERNOTICE #somechannel', { usernotice });

    expect(usernotice).toHaveBeenCalledWith(
      '#somechannel',
      { 'msg-id': 'sub', login: 'subber' },
      '',
    );
  });

  test('parses ban duration for clearchat and passes the target user', () => {
    const clearchat = jest.fn();
    route('@ban-duration=600 CLEARCHAT #somechannel :baduser', { clearchat });

    expect(clearchat).toHaveBeenCalledWith(
      '#somechannel',
      { 'ban-duration': '600' },
      'baduser',
      600,
    );
  });

  test('requires target-msg-id for clearmsg', () => {
    const clearmsg = jest.fn();
    route('@login=x CLEARMSG #somechannel :deleted text', { clearmsg });
    expect(clearmsg).not.toHaveBeenCalled();

    route('@login=x;target-msg-id=abc CLEARMSG #somechannel :deleted text', {
      clearmsg,
    });
    expect(clearmsg).toHaveBeenCalledWith(
      '#somechannel',
      { login: 'x', 'target-msg-id': 'abc' },
      'abc',
    );
  });

  test('splits channel and channelless notices', () => {
    const notice = jest.fn();
    const channellessNotice = jest.fn();
    route('@msg-id=slow_on NOTICE #somechannel :Slow mode is on', {
      notice,
      channellessNotice,
    });
    expect(notice).toHaveBeenCalledWith(
      '#somechannel',
      { 'msg-id': 'slow_on' },
      'Slow mode is on',
    );

    route('NOTICE :Welcome, GLHF!', { notice, channellessNotice });
    expect(channellessNotice).toHaveBeenCalledWith('Welcome, GLHF!');
    expect(notice).toHaveBeenCalledTimes(1);
  });

  test('extracts the nick from the prefix for join and part', () => {
    const join = jest.fn();
    const part = jest.fn();
    route(':someuser!someuser@someuser.tmi.twitch.tv JOIN #somechannel', {
      join,
    });
    route(':someuser!someuser@someuser.tmi.twitch.tv PART #somechannel', {
      part,
    });

    expect(join).toHaveBeenCalledWith('#somechannel', 'someuser');
    expect(part).toHaveBeenCalledWith('#somechannel', 'someuser');
  });

  test('defaults the ping server', () => {
    const ping = jest.fn();
    routeIrcMessage({ command: 'PING', params: [] }, { ping });

    expect(ping).toHaveBeenCalledWith('tmi.twitch.tv');
  });

  test('dispatches welcome and motd for 001', () => {
    const welcome = jest.fn();
    const motd = jest.fn();
    route(':tmi.twitch.tv 001 justinfan123 :Welcome, GLHF!', {
      welcome,
      motd,
    });

    expect(welcome).toHaveBeenCalledTimes(1);
    expect(motd).toHaveBeenCalledTimes(1);
  });

  test('reuses one frozen empty record for tagless globaluserstate', () => {
    const seen: Record<string, string>[] = [];
    const globaluserstate = (tags: Record<string, string>) => {
      seen.push(tags);
    };
    routeIrcMessage(
      { command: 'GLOBALUSERSTATE', params: [] },
      {
        globaluserstate,
      },
    );
    routeIrcMessage(
      { command: 'GLOBALUSERSTATE', params: [] },
      {
        globaluserstate,
      },
    );

    expect(seen[0]).toBe(seen[1]);
    expect(Object.isFrozen(seen[0])).toBe(true);
  });

  test('routes unknown commands to unhandled', () => {
    const unhandled = jest.fn();
    route(':tmi.twitch.tv HOSTTARGET #somechannel :- 0', { unhandled });

    expect(unhandled).toHaveBeenCalledWith('HOSTTARGET', [
      '#somechannel',
      '- 0',
    ]);
  });
});
