import { getChatCommandFeedback, parseChatCommand } from '../chatCommands';

const moderatorContext = {
  canModerateChat: true,
  isBroadcaster: false,
};

const broadcasterContext = {
  canModerateChat: true,
  isBroadcaster: true,
};

const viewerContext = {
  canModerateChat: false,
  isBroadcaster: false,
};

describe('chatCommands', () => {
  describe('parseChatCommand', () => {
    test('normalizes timeout commands with human-readable durations', () => {
      expect(parseChatCommand('/timeout viewer 10m', moderatorContext)).toEqual(
        {
          ok: true,
          delivery: 'chat-command',
          command: '/timeout viewer 600',
        },
      );
    });

    test('parses ban commands for moderators', () => {
      expect(parseChatCommand('/ban viewer spam', moderatorContext)).toEqual({
        ok: true,
        delivery: 'chat-command',
        command: '/ban viewer spam',
      });
    });

    test('rejects ban commands for non-moderators', () => {
      expect(parseChatCommand('/ban viewer', viewerContext)).toEqual({
        ok: false,
        error: 'Only moderators can use this command',
      });
    });

    test('parses broadcaster-only mod commands', () => {
      expect(parseChatCommand('/mod helper', broadcasterContext)).toEqual({
        ok: true,
        delivery: 'chat-command',
        command: '/mod helper',
      });
      expect(parseChatCommand('/mod helper', moderatorContext)).toEqual({
        ok: false,
        error: 'Only the broadcaster can use this command',
      });
    });

    test('routes /me to action delivery', () => {
      expect(parseChatCommand('/me waves hello', viewerContext)).toEqual({
        ok: true,
        delivery: 'action',
        message: 'waves hello',
      });
    });

    test('parses no-arg moderator commands', () => {
      expect(parseChatCommand('/clear', moderatorContext)).toEqual({
        ok: true,
        delivery: 'chat-command',
        command: '/clear',
      });
    });

    test('returns null for unknown slash commands', () => {
      expect(parseChatCommand('/botcommand args', viewerContext)).toBeNull();
    });

    test('returns null for regular chat messages', () => {
      expect(parseChatCommand('hello world', viewerContext)).toBeNull();
    });
  });

  describe('getChatCommandFeedback', () => {
    test('returns null for unknown commands', () => {
      expect(getChatCommandFeedback('/foo', viewerContext)).toBeNull();
    });

    test('shows incomplete hints while a timeout command is being typed', () => {
      expect(
        getChatCommandFeedback('/timeout viewer', moderatorContext),
      ).toEqual({
        status: 'incomplete',
        message: 'Enter a duration like 10m, 1h, or 1day',
      });
    });

    test('shows permission errors immediately', () => {
      expect(getChatCommandFeedback('/ban viewer', viewerContext)).toEqual({
        status: 'error',
        message: 'Only moderators can use this command',
      });
    });

    test('shows validation errors for invalid durations', () => {
      expect(
        getChatCommandFeedback('/timeout viewer 10x', moderatorContext),
      ).toEqual({
        status: 'error',
        message: 'Unknown duration unit',
      });
    });

    test('marks valid commands as valid', () => {
      expect(
        getChatCommandFeedback('/timeout viewer 10m', moderatorContext),
      ).toEqual({
        status: 'valid',
      });
    });
  });
});
