import i18next from 'i18next';

import { twitchService } from '@app/services/twitch-service';

import type { ModCommand } from './modCommands';

export interface ModCommandContext {
  broadcasterId: string;
  moderatorId: string;
}

async function resolveUserId(login: string): Promise<string> {
  const user = await twitchService.getUser(login);
  const userId = typeof user === 'object' ? user.id?.trim() : '';
  if (!userId) {
    throw new Error(`No Twitch user found for login "${login}"`);
  }
  return userId;
}

/**
 * Runs a parsed moderation command against Helix and resolves with the toast
 * text to show on success. Rejections surface as a generic failure toast at
 * the call site (Helix 403s here simply mean the sender is not a moderator).
 */
export async function executeModCommand(
  command: ModCommand,
  context: ModCommandContext,
): Promise<string> {
  const { broadcasterId, moderatorId } = context;

  switch (command.type) {
    case 'timeout': {
      const userId = await resolveUserId(command.login);
      await twitchService.banChatUser(broadcasterId, moderatorId, userId, {
        durationSeconds: command.durationSeconds,
        reason: command.reason,
      });
      return i18next.t('chat:modCommands.timedOut', {
        login: command.login,
        seconds: command.durationSeconds,
      });
    }
    case 'ban': {
      const userId = await resolveUserId(command.login);
      await twitchService.banChatUser(broadcasterId, moderatorId, userId, {
        reason: command.reason,
      });
      return i18next.t('chat:modCommands.banned', { login: command.login });
    }
    case 'unban': {
      const userId = await resolveUserId(command.login);
      await twitchService.unbanChatUser(broadcasterId, moderatorId, userId);
      return i18next.t('chat:modCommands.unbanned', { login: command.login });
    }
    case 'warn': {
      const userId = await resolveUserId(command.login);
      await twitchService.warnChatUser(
        broadcasterId,
        moderatorId,
        userId,
        command.reason,
      );
      return i18next.t('chat:modCommands.warned', { login: command.login });
    }
    case 'announce': {
      await twitchService.sendChatAnnouncement(
        broadcasterId,
        moderatorId,
        command.message,
      );
      return i18next.t('chat:modCommands.announced');
    }
    case 'shoutout': {
      const userId = await resolveUserId(command.login);
      await twitchService.sendShoutout(broadcasterId, userId, moderatorId);
      return i18next.t('chat:modCommands.shoutedOut', {
        login: command.login,
      });
    }
    case 'chatMode': {
      await twitchService.updateChatSettings(
        broadcasterId,
        moderatorId,
        command.patch,
      );
      return i18next.t('chat:modCommands.chatModeUpdated', {
        mode: command.label,
      });
    }
    case 'shield': {
      await twitchService.updateShieldMode(
        broadcasterId,
        moderatorId,
        command.active,
      );
      return command.active
        ? i18next.t('chat:modCommands.shieldOn')
        : i18next.t('chat:modCommands.shieldOff');
    }
  }
}
