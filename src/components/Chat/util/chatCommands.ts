import {
  normalizeTimeoutCommand,
  parseTimeoutDuration,
} from './timeoutDuration';

/**
 * Twitch `/` command parsing and validation.
 *
 * Command docs: https://help.twitch.tv/s/article/chat-commands
 *
 * Basic commands for everyone
 * /block, /unblock, /color, /disconnect, /mods, /vips, /w
 *
 * Basic commands for broadcasters and moderators:
 * /announce, /ban, /unban, /clear, /delete, /emoteonly, /emoteonlyoff,
 * /followers, /followersoff, /monitor, /unmonitor, /restrict, /unrestrict,
 * /slow, /slowoff, /subscribers, /subscribersoff, /timeout, /uniquechat,
 * /uniquechatoff
 *
 * Aliases: r9kbeta → /uniquechat, r9kbetaoff → /uniquechatoff,
 * untimeout → /unban, shieldmode → /shield, shieldmodeoff → /shieldoff
 *
 * Channel editor and broadcaster commands:
 * /commercial, /marker, /raid, /unraid
 *
 * Broadcaster commands:
 * /mod, /unmod, /vip, /unvip
 *
 * /shoutout — https://help.twitch.tv/s/article/shoutouts
 * /warn, /shield, /shieldoff — https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat
 *
 * /me is sent as an IRC action, not a native chat command.
 */

export type ChatCommandPermission = 'anyone' | 'moderator' | 'broadcaster';

export interface ChatCommandContext {
  canModerateChat: boolean;
  isBroadcaster: boolean;
}

export type ChatCommandFeedback =
  | { status: 'valid' }
  | { status: 'incomplete'; message: string }
  | { status: 'error'; message: string };

export type ParseChatCommandResult =
  | { ok: true; delivery: 'chat-command'; command: string }
  | { ok: true; delivery: 'action'; message: string }
  | { ok: false; error: string };

type ValidationMode = 'live' | 'submit';

interface SlashCommandParts {
  name: string;
  args: string;
}

const COMMAND_ALIASES: Record<string, string> = {
  r9kbeta: 'uniquechat',
  r9kbetaoff: 'uniquechatoff',
  shieldmode: 'shield',
  shieldmodeoff: 'shieldoff',
  untimeout: 'unban',
};

function splitSlashCommand(input: string): SlashCommandParts | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const body = trimmed.slice(1);
  if (!body) {
    return { name: '', args: '' };
  }

  const spaceIndex = body.search(/\s/);
  if (spaceIndex === -1) {
    return { name: body.toLowerCase(), args: '' };
  }

  return {
    name: body.slice(0, spaceIndex).toLowerCase(),
    args: body.slice(spaceIndex + 1).trim(),
  };
}

function resolveCommandName(name: string): string {
  return COMMAND_ALIASES[name] ?? name;
}

function permissionError(
  permission: ChatCommandPermission,
  context: ChatCommandContext,
): string | null {
  if (permission === 'anyone') {
    return null;
  }

  if (permission === 'moderator' && !context.canModerateChat) {
    return 'Only moderators can use this command';
  }

  if (permission === 'broadcaster' && !context.isBroadcaster) {
    return 'Only the broadcaster can use this command';
  }

  return null;
}

function parseUsernameArgs(args: string): {
  username?: string;
  rest?: string;
  missing: boolean;
} {
  const trimmed = args.trim();
  if (!trimmed) {
    return { missing: true };
  }

  const match = trimmed.match(/^@?(\S+)(?:\s+(.*))?$/);
  if (!match) {
    return { missing: true };
  }

  return {
    username: match[1],
    rest: match[2]?.trim(),
    missing: false,
  };
}

function parseOptionalSeconds(args: string): ParseChatCommandResult | null {
  const trimmed = args.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: 'Duration must be a number of seconds' };
  }

  return null;
}

function validateUsernameCommand({
  command,
  usage,
  args,
  mode,
  permission,
  context,
  requireUsername = true,
}: {
  command: string;
  usage: string;
  args: string;
  mode: ValidationMode;
  permission: ChatCommandPermission;
  context: ChatCommandContext;
  requireUsername?: boolean;
}): ParseChatCommandResult {
  const denied = permissionError(permission, context);

  if (denied) {
    return { ok: false, error: denied };
  }

  const parsed = parseUsernameArgs(args);

  if (parsed.missing) {
    if (!requireUsername) {
      return { ok: true, delivery: 'chat-command', command: `/${command}` };
    }

    if (mode === 'live' && !args.trim()) {
      return { ok: false, error: usage };
    }

    return { ok: false, error: usage };
  }

  const suffix = parsed.rest ? ` ${parsed.rest}` : '';
  return {
    ok: true,
    delivery: 'chat-command',
    command: `/${command} ${parsed.username}${suffix}`,
  };
}

function validateNoArgCommand({
  command,
  permission,
  context,
}: {
  command: string;
  permission: ChatCommandPermission;
  context: ChatCommandContext;
}): ParseChatCommandResult {
  const denied = permissionError(permission, context);
  if (denied) {
    return { ok: false, error: denied };
  }

  return { ok: true, delivery: 'chat-command', command: `/${command}` };
}

function validateMessageCommand({
  command,
  usage,
  args,
  mode,
  permission,
  context,
}: {
  command: string;
  usage: string;
  args: string;
  mode: ValidationMode;
  permission: ChatCommandPermission;
  context: ChatCommandContext;
}): ParseChatCommandResult {
  const denied = permissionError(permission, context);
  if (denied) {
    return { ok: false, error: denied };
  }

  if (!args.trim()) {
    if (mode === 'live') {
      return { ok: false, error: usage };
    }
    return { ok: false, error: usage };
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/${command} ${args.trim()}`,
  };
}

function validateTimeoutCommand(
  args: string,
  mode: ValidationMode,
  context: ChatCommandContext,
): ParseChatCommandResult {
  const denied = permissionError('moderator', context);
  if (denied) {
    return { ok: false, error: denied };
  }

  const parsed = parseUsernameArgs(args);
  if (parsed.missing) {
    return { ok: false, error: 'Usage: /timeout username 10m' };
  }

  const durationPart = parsed.rest?.trim() ?? '';
  if (!durationPart) {
    if (mode === 'live') {
      return { ok: false, error: 'Enter a duration like 10m, 1h, or 1day' };
    }
    return { ok: false, error: 'Enter a duration like 10m, 1h, or 1day' };
  }

  const durationToken = durationPart.split(/\s+/)[0] ?? '';
  const reason = durationPart.slice(durationToken.length).trim();
  const duration = parseTimeoutDuration(durationToken);
  if (!duration.ok) {
    return duration;
  }

  const command = `/timeout ${parsed.username} ${duration.seconds}`;
  return {
    ok: true,
    delivery: 'chat-command',
    command: reason ? `${command} ${reason}` : command,
  };
}

function validateWhisperCommand(
  args: string,
  mode: ValidationMode,
): ParseChatCommandResult {
  const parsed = parseUsernameArgs(args);
  if (parsed.missing || !parsed.rest?.trim()) {
    if (mode === 'live' && !args.trim()) {
      return { ok: false, error: 'Usage: /w username message' };
    }
    return { ok: false, error: 'Usage: /w username message' };
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/w ${parsed.username} ${parsed.rest.trim()}`,
  };
}

function validateDeleteCommand(
  args: string,
  mode: ValidationMode,
  context: ChatCommandContext,
): ParseChatCommandResult {
  const denied = permissionError('moderator', context);
  if (denied) {
    return { ok: false, error: denied };
  }

  if (!args.trim()) {
    if (mode === 'live') {
      return { ok: false, error: 'Usage: /delete message-id' };
    }
    return { ok: false, error: 'Usage: /delete message-id' };
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/delete ${args.trim()}`,
  };
}

function validateFollowersCommand(
  args: string,
  context: ChatCommandContext,
): ParseChatCommandResult {
  const denied = permissionError('moderator', context);
  if (denied) {
    return { ok: false, error: denied };
  }

  if (!args.trim()) {
    return { ok: true, delivery: 'chat-command', command: '/followers' };
  }

  const duration = parseTimeoutDuration(args.trim());
  if (!duration.ok) {
    return duration;
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/followers ${duration.seconds}`,
  };
}

function validateSlowCommand(
  args: string,
  context: ChatCommandContext,
): ParseChatCommandResult {
  const denied = permissionError('moderator', context);
  if (denied) {
    return { ok: false, error: denied };
  }

  if (!args.trim()) {
    return { ok: true, delivery: 'chat-command', command: '/slow' };
  }

  const secondsError = parseOptionalSeconds(args);
  if (secondsError) {
    return secondsError;
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/slow ${args.trim()}`,
  };
}

function validateCommercialCommand(
  args: string,
  context: ChatCommandContext,
): ParseChatCommandResult {
  const denied = permissionError('broadcaster', context);
  if (denied) {
    return { ok: false, error: denied };
  }

  if (!args.trim()) {
    return { ok: true, delivery: 'chat-command', command: '/commercial' };
  }

  const secondsError = parseOptionalSeconds(args);
  if (secondsError) {
    return secondsError;
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/commercial ${args.trim()}`,
  };
}

function validateColorCommand(args: string): ParseChatCommandResult {
  if (!args.trim()) {
    return { ok: false, error: 'Usage: /color #9147FF' };
  }

  return {
    ok: true,
    delivery: 'chat-command',
    command: `/color ${args.trim()}`,
  };
}

function validateKnownCommand(
  input: string,
  context: ChatCommandContext,
  mode: ValidationMode,
): ParseChatCommandResult | null {
  const parts = splitSlashCommand(input);
  if (!parts) {
    return null;
  }

  const command = resolveCommandName(parts.name);

  switch (command) {
    case 'announce':
      return validateMessageCommand({
        command,
        usage: 'Usage: /announce message',
        args: parts.args,
        mode,
        permission: 'moderator',
        context,
      });
    case 'ban':
      return validateUsernameCommand({
        command,
        usage: 'Usage: /ban username',
        args: parts.args,
        mode,
        permission: 'moderator',
        context,
      });
    case 'unban':
      return validateUsernameCommand({
        command,
        usage: 'Usage: /unban username',
        args: parts.args,
        mode,
        permission: 'moderator',
        context,
      });
    case 'block':
    case 'unblock':
      return validateUsernameCommand({
        command,
        usage: `Usage: /${command} username`,
        args: parts.args,
        mode,
        permission: 'anyone',
        context,
      });
    case 'clear':
    case 'emoteonly':
    case 'emoteonlyoff':
    case 'followersoff':
    case 'mods':
    case 'shield':
    case 'shieldoff':
    case 'slowoff':
    case 'subscribers':
    case 'subscribersoff':
    case 'uniquechat':
    case 'uniquechatoff':
    case 'unraid':
    case 'vips':
    case 'disconnect':
      return validateNoArgCommand({
        command,
        permission:
          command === 'mods' || command === 'vips' || command === 'disconnect'
            ? 'anyone'
            : 'moderator',
        context,
      });
    case 'color':
      return validateColorCommand(parts.args);
    case 'commercial':
      return validateCommercialCommand(parts.args, context);
    case 'delete':
      return validateDeleteCommand(parts.args, mode, context);
    case 'followers':
      return validateFollowersCommand(parts.args, context);
    case 'marker':
      return validateMessageCommand({
        command,
        usage: 'Usage: /marker description',
        args: parts.args,
        mode,
        permission: 'moderator',
        context,
      });
    case 'me':
      if (!parts.args.trim()) {
        return { ok: false, error: 'Usage: /me action' };
      }
      return { ok: true, delivery: 'action', message: parts.args.trim() };
    case 'mod':
    case 'unmod':
    case 'vip':
    case 'unvip':
      return validateUsernameCommand({
        command,
        usage: `Usage: /${command} username`,
        args: parts.args,
        mode,
        permission: 'broadcaster',
        context,
      });
    case 'monitor':
    case 'unmonitor':
    case 'restrict':
    case 'unrestrict':
    case 'raid':
    case 'shoutout':
    case 'warn':
      return validateUsernameCommand({
        command,
        usage: `Usage: /${command} username`,
        args: parts.args,
        mode,
        permission:
          command === 'raid' || command === 'shoutout'
            ? 'broadcaster'
            : 'moderator',
        context,
      });
    case 'slow':
      return validateSlowCommand(parts.args, context);
    case 'timeout': {
      const normalized = normalizeTimeoutCommand(input.trim());
      if (normalized) {
        if (!normalized.ok) {
          return normalized;
        }
        return {
          ok: true,
          delivery: 'chat-command',
          command: normalized.command,
        };
      }
      return validateTimeoutCommand(parts.args, mode, context);
    }
    case 'w':
      return validateWhisperCommand(parts.args, mode);
    default:
      return null;
  }
}

function isLikelyIncompleteCommand(command: string, args: string): boolean {
  if (!args.trim()) {
    return true;
  }

  if (command === 'timeout' || command === 'w') {
    const parsed = parseUsernameArgs(args);
    return Boolean(parsed.username && !parsed.rest?.trim());
  }

  return false;
}

export function getChatCommandFeedback(
  input: string,
  context: ChatCommandContext,
): ChatCommandFeedback | null {
  const parts = splitSlashCommand(input);
  if (!parts?.name) {
    return null;
  }

  const command = resolveCommandName(parts.name);

  const result = validateKnownCommand(input, context, 'live');
  if (!result) {
    return null;
  }

  if (result.ok) {
    return { status: 'valid' };
  }

  if (result.error.startsWith('Only ')) {
    return { status: 'error', message: result.error };
  }

  if (isLikelyIncompleteCommand(command, parts.args)) {
    return { status: 'incomplete', message: result.error };
  }

  return { status: 'error', message: result.error };
}

export function parseChatCommand(
  input: string,
  context: ChatCommandContext,
): ParseChatCommandResult | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const result = validateKnownCommand(trimmed, context, 'submit');
  if (result) {
    return result;
  }

  return null;
}
