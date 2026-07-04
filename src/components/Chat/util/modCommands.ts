import type { TwitchChatSettingsPatch } from '@app/types/twitch/moderation';

export type ModCommand =
  | { type: 'timeout'; login: string; durationSeconds: number; reason?: string }
  | { type: 'ban'; login: string; reason?: string }
  | { type: 'unban'; login: string }
  | { type: 'warn'; login: string; reason: string }
  | { type: 'announce'; message: string }
  | { type: 'shoutout'; login: string }
  | { type: 'chatMode'; label: string; patch: TwitchChatSettingsPatch }
  | { type: 'shield'; active: boolean };

const DEFAULT_TIMEOUT_SECONDS = 600;
const DEFAULT_SLOW_MODE_SECONDS = 30;

function normaliseLogin(value: string): string {
  return value.replace(/^@/, '').trim().toLowerCase();
}

/**
 * Parses composer input into a moderation command, or null when the input is
 * not one. Twitch removed slash commands from IRC in 2023, so these map to
 * Helix endpoints instead of being sent as chat text.
 */
export function parseModCommand(input: string): ModCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const [rawCommand = '', ...args] = trimmed.slice(1).split(/\s+/);
  const command = rawCommand.toLowerCase();

  switch (command) {
    case 'timeout': {
      const login = normaliseLogin(args[0] ?? '');
      if (!login) {
        return null;
      }
      const parsedDuration = Number.parseInt(args[1] ?? '', 10);
      const hasDuration = Number.isFinite(parsedDuration) && parsedDuration > 0;
      const reason = args.slice(hasDuration ? 2 : 1).join(' ');
      return {
        type: 'timeout',
        login,
        durationSeconds: hasDuration ? parsedDuration : DEFAULT_TIMEOUT_SECONDS,
        ...(reason && { reason }),
      };
    }
    case 'ban': {
      const login = normaliseLogin(args[0] ?? '');
      if (!login) {
        return null;
      }
      const reason = args.slice(1).join(' ');
      return { type: 'ban', login, ...(reason && { reason }) };
    }
    case 'unban':
    case 'untimeout': {
      const login = normaliseLogin(args[0] ?? '');
      return login ? { type: 'unban', login } : null;
    }
    case 'warn': {
      const login = normaliseLogin(args[0] ?? '');
      const reason = args.slice(1).join(' ');
      return login && reason ? { type: 'warn', login, reason } : null;
    }
    case 'announce': {
      const message = args.join(' ');
      return message ? { type: 'announce', message } : null;
    }
    case 'shoutout':
    case 'so': {
      const login = normaliseLogin(args[0] ?? '');
      return login ? { type: 'shoutout', login } : null;
    }
    case 'slow': {
      const parsedSeconds = Number.parseInt(args[0] ?? '', 10);
      const seconds =
        Number.isFinite(parsedSeconds) && parsedSeconds > 0
          ? parsedSeconds
          : DEFAULT_SLOW_MODE_SECONDS;
      return {
        type: 'chatMode',
        label: `Slow mode (${seconds}s)`,
        patch: { slow_mode: true, slow_mode_wait_time: seconds },
      };
    }
    case 'slowoff':
      return {
        type: 'chatMode',
        label: 'Slow mode off',
        patch: { slow_mode: false },
      };
    case 'followers': {
      const parsedMinutes = Number.parseInt(args[0] ?? '', 10);
      const minutes =
        Number.isFinite(parsedMinutes) && parsedMinutes >= 0
          ? parsedMinutes
          : 0;
      return {
        type: 'chatMode',
        label: 'Followers-only mode',
        patch: { follower_mode: true, follower_mode_duration: minutes },
      };
    }
    case 'followersoff':
      return {
        type: 'chatMode',
        label: 'Followers-only mode off',
        patch: { follower_mode: false },
      };
    case 'subscribers':
      return {
        type: 'chatMode',
        label: 'Subscribers-only mode',
        patch: { subscriber_mode: true },
      };
    case 'subscribersoff':
      return {
        type: 'chatMode',
        label: 'Subscribers-only mode off',
        patch: { subscriber_mode: false },
      };
    case 'emoteonly':
      return {
        type: 'chatMode',
        label: 'Emote-only mode',
        patch: { emote_mode: true },
      };
    case 'emoteonlyoff':
      return {
        type: 'chatMode',
        label: 'Emote-only mode off',
        patch: { emote_mode: false },
      };
    case 'uniquechat':
      return {
        type: 'chatMode',
        label: 'Unique-chat mode',
        patch: { unique_chat_mode: true },
      };
    case 'uniquechatoff':
      return {
        type: 'chatMode',
        label: 'Unique-chat mode off',
        patch: { unique_chat_mode: false },
      };
    case 'shield':
      return { type: 'shield', active: true };
    case 'shieldoff':
      return { type: 'shield', active: false };
    default:
      return null;
  }
}
