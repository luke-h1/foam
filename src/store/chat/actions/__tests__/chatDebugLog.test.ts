import {
  acquireChatDebugLog,
  clearChatDebugLog,
  getChatDebugIrcLines,
  getChatDebugIrcLinesForLogin,
  isChatDebugLogEnabled,
  recordChatDebugIrcLine,
  releaseChatDebugLog,
} from '../chatDebugLog';

const privmsg = (login: string, body: string) =>
  `@badge-info=;badges=moderator/1;color=#FF0000;display-name=${login};id=abc;user-id=123 :${login}!${login}@${login}.tmi.twitch.tv PRIVMSG #channel :${body}`;

describe('chatDebugLog', () => {
  beforeEach(() => {
    acquireChatDebugLog();
    clearChatDebugLog();
  });

  afterEach(() => {
    while (isChatDebugLogEnabled()) {
      releaseChatDebugLog();
    }
  });

  test('records lines newest first', () => {
    recordChatDebugIrcLine('first');
    recordChatDebugIrcLine('second');

    expect(getChatDebugIrcLines().map(entry => entry.line)).toEqual([
      'second',
      'first',
    ]);
  });

  test('marks flood-dropped lines', () => {
    recordChatDebugIrcLine(privmsg('someuser', 'hello'), true);

    const [entry] = getChatDebugIrcLines();
    expect(entry?.dropped).toBe(true);
  });

  test('ignores records once every recorder releases and wipes the buffer', () => {
    recordChatDebugIrcLine('kept');
    releaseChatDebugLog();

    expect(isChatDebugLogEnabled()).toBe(false);
    expect(getChatDebugIrcLines()).toEqual([]);

    recordChatDebugIrcLine('ignored');
    expect(getChatDebugIrcLines()).toEqual([]);
  });

  test('keeps recording while another recorder is still acquired', () => {
    acquireChatDebugLog();
    recordChatDebugIrcLine('first');
    releaseChatDebugLog();

    expect(isChatDebugLogEnabled()).toBe(true);
    recordChatDebugIrcLine('second');
    expect(getChatDebugIrcLines().map(entry => entry.line)).toEqual([
      'second',
      'first',
    ]);
  });

  test('bounds the buffer to the most recent lines', () => {
    for (let index = 0; index < 300; index += 1) {
      recordChatDebugIrcLine(`line-${index}`);
    }

    const lines = getChatDebugIrcLines();
    expect(lines).toHaveLength(250);
    expect(lines[0]?.line).toBe('line-299');
    expect(lines[249]?.line).toBe('line-50');
  });

  test('filters lines by sender prefix', () => {
    recordChatDebugIrcLine(privmsg('alice', 'one'));
    recordChatDebugIrcLine(privmsg('bob', 'two'));
    recordChatDebugIrcLine(privmsg('alice', 'three'));

    const lines = getChatDebugIrcLinesForLogin('Alice').map(
      entry => entry.line,
    );
    expect(lines).toEqual([privmsg('alice', 'three'), privmsg('alice', 'one')]);
  });

  test('matches usernotices through the login tag', () => {
    const usernotice =
      '@badge-info=;login=alice;msg-id=resub;system-msg=resubbed :tmi.twitch.tv USERNOTICE #channel';
    recordChatDebugIrcLine(usernotice);

    expect(
      getChatDebugIrcLinesForLogin('@alice').map(entry => entry.line),
    ).toEqual([usernotice]);
  });

  test('matches clearchat moderation lines through the trailing login param', () => {
    const clearchat =
      '@ban-duration=600;room-id=1;target-user-id=2;tmi-sent-ts=3 :tmi.twitch.tv CLEARCHAT #channel :alice';
    recordChatDebugIrcLine(clearchat);
    recordChatDebugIrcLine(privmsg('bob', 'unrelated'));

    expect(
      getChatDebugIrcLinesForLogin('alice').map(entry => entry.line),
    ).toEqual([clearchat]);
  });

  test('matches a login tag in final position before the prefix', () => {
    const usernotice =
      '@msg-id=resub;login=alice :tmi.twitch.tv USERNOTICE #channel :welcome back';
    recordChatDebugIrcLine(usernotice);

    expect(
      getChatDebugIrcLinesForLogin('alice').map(entry => entry.line),
    ).toEqual([usernotice]);
  });

  test('never matches on message-body text that mimics identity markers', () => {
    recordChatDebugIrcLine(privmsg('bob', 'check !alice@example.com'));
    recordChatDebugIrcLine(
      privmsg('bob', '@badges=;display-name=alice;color=#FFF'),
    );
    recordChatDebugIrcLine(privmsg('bob', 'lol CLEARCHAT incoming :alice'));

    expect(getChatDebugIrcLinesForLogin('alice')).toEqual([]);
    expect(getChatDebugIrcLinesForLogin('bob')).toHaveLength(3);
  });

  test('never matches identity markers quoted inside reply tag values', () => {
    recordChatDebugIrcLine(
      '@reply-parent-msg-body=check\\s!alice@example.com\\sand\\s@login=alice;color=#FFF :bob!bob@bob.tmi.twitch.tv PRIVMSG #channel :hi',
    );

    expect(getChatDebugIrcLinesForLogin('alice')).toEqual([]);
    expect(getChatDebugIrcLinesForLogin('bob')).toHaveLength(1);
  });

  test('matches a display name whose spaces are tag-escaped', () => {
    const usernotice =
      '@display-name=Alice\\sSmith;msg-id=resub :tmi.twitch.tv USERNOTICE #channel :hi';
    recordChatDebugIrcLine(usernotice);

    expect(
      getChatDebugIrcLinesForLogin('Alice Smith').map(entry => entry.line),
    ).toEqual([usernotice]);
  });

  test('caps per-login results at the requested limit', () => {
    for (let index = 0; index < 15; index += 1) {
      recordChatDebugIrcLine(privmsg('alice', `msg-${index}`));
    }

    expect(getChatDebugIrcLinesForLogin('alice')).toHaveLength(10);
    expect(getChatDebugIrcLinesForLogin('alice', 3)).toHaveLength(3);
  });

  test('returns nothing for an empty login', () => {
    recordChatDebugIrcLine(privmsg('alice', 'one'));

    expect(getChatDebugIrcLinesForLogin('')).toEqual([]);
    expect(getChatDebugIrcLinesForLogin(undefined)).toEqual([]);
  });
});
