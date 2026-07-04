import { type ModCommand, parseModCommand } from '../modCommands';

describe('parseModCommand', () => {
  test('returns null for plain messages and unknown commands', () => {
    expect(parseModCommand('hello world')).toBeNull();
    expect(parseModCommand('/me waves')).toBeNull();
    expect(parseModCommand('/refresh')).toBeNull();
    expect(parseModCommand('/nonsense arg')).toBeNull();
  });

  test('parses /timeout with defaults', () => {
    expect(parseModCommand('/timeout zoil')).toEqual<ModCommand>({
      type: 'timeout',
      login: 'zoil',
      durationSeconds: 600,
    });
  });

  test('parses /timeout with duration and reason', () => {
    expect(parseModCommand('/timeout @Zoil 30 calm down')).toEqual<ModCommand>({
      type: 'timeout',
      login: 'zoil',
      durationSeconds: 30,
      reason: 'calm down',
    });
  });

  test('treats a non-numeric second argument as part of the reason', () => {
    expect(parseModCommand('/timeout zoil spamming links')).toEqual<ModCommand>(
      {
        type: 'timeout',
        login: 'zoil',
        durationSeconds: 600,
        reason: 'spamming links',
      },
    );
  });

  test('parses /ban with and without a reason', () => {
    expect(parseModCommand('/ban zoil')).toEqual<ModCommand>({
      type: 'ban',
      login: 'zoil',
    });
    expect(parseModCommand('/ban zoil hate speech')).toEqual<ModCommand>({
      type: 'ban',
      login: 'zoil',
      reason: 'hate speech',
    });
  });

  test('parses /unban and /untimeout', () => {
    expect(parseModCommand('/unban zoil')).toEqual<ModCommand>({
      type: 'unban',
      login: 'zoil',
    });
    expect(parseModCommand('/untimeout zoil')).toEqual<ModCommand>({
      type: 'unban',
      login: 'zoil',
    });
  });

  test('parses /warn only when a reason is present', () => {
    expect(
      parseModCommand('/warn zoil watch the language'),
    ).toEqual<ModCommand>({
      type: 'warn',
      login: 'zoil',
      reason: 'watch the language',
    });
    expect(parseModCommand('/warn zoil')).toBeNull();
  });

  test('parses /announce with the full message', () => {
    expect(parseModCommand('/announce drops are enabled!')).toEqual<ModCommand>(
      {
        type: 'announce',
        message: 'drops are enabled!',
      },
    );
    expect(parseModCommand('/announce')).toBeNull();
  });

  test('parses /shoutout and its /so alias', () => {
    expect(parseModCommand('/shoutout zoil')).toEqual<ModCommand>({
      type: 'shoutout',
      login: 'zoil',
    });
    expect(parseModCommand('/so @Zoil')).toEqual<ModCommand>({
      type: 'shoutout',
      login: 'zoil',
    });
  });

  test('parses slow mode commands', () => {
    expect(parseModCommand('/slow')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Slow mode (30s)',
      patch: { slow_mode: true, slow_mode_wait_time: 30 },
    });
    expect(parseModCommand('/slow 120')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Slow mode (120s)',
      patch: { slow_mode: true, slow_mode_wait_time: 120 },
    });
    expect(parseModCommand('/slowoff')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Slow mode off',
      patch: { slow_mode: false },
    });
  });

  test('parses follower mode commands', () => {
    expect(parseModCommand('/followers 10')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Followers-only mode',
      patch: { follower_mode: true, follower_mode_duration: 10 },
    });
    expect(parseModCommand('/followers')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Followers-only mode',
      patch: { follower_mode: true, follower_mode_duration: 0 },
    });
    expect(parseModCommand('/followersoff')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Followers-only mode off',
      patch: { follower_mode: false },
    });
  });

  test('parses the remaining chat mode toggles', () => {
    expect(parseModCommand('/subscribers')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Subscribers-only mode',
      patch: { subscriber_mode: true },
    });
    expect(parseModCommand('/emoteonlyoff')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Emote-only mode off',
      patch: { emote_mode: false },
    });
    expect(parseModCommand('/uniquechat')).toEqual<ModCommand>({
      type: 'chatMode',
      label: 'Unique-chat mode',
      patch: { unique_chat_mode: true },
    });
  });

  test('parses shield mode commands', () => {
    expect(parseModCommand('/shield')).toEqual<ModCommand>({
      type: 'shield',
      active: true,
    });
    expect(parseModCommand('/shieldoff')).toEqual<ModCommand>({
      type: 'shield',
      active: false,
    });
  });
});
