import { twitchService } from '@app/services/twitch-service';

import type { ModCommand } from './parseModCommand';

export interface ModCommandContext {
  broadcasterId: string;
  moderatorId: string;
}

async function resolveUserId(login: string): Promise<string> {
  const user = await twitchService.getUser(login);
  const userId = user.id?.trim();
  if (!userId) {
    throw new Error(`No Twitch user found for login "${login}"`);
  }
  return userId;
}

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
      return `Timed out ${command.login} for ${command.durationSeconds}s`;
    }
    case 'ban': {
      const userId = await resolveUserId(command.login);
      await twitchService.banChatUser(broadcasterId, moderatorId, userId, {
        reason: command.reason,
      });
      return `Banned ${command.login}`;
    }
    case 'unban': {
      const userId = await resolveUserId(command.login);
      await twitchService.unbanChatUser(broadcasterId, moderatorId, userId);
      return `Unbanned ${command.login}`;
    }
    case 'warn': {
      const userId = await resolveUserId(command.login);
      await twitchService.warnChatUser(
        broadcasterId,
        moderatorId,
        userId,
        command.reason,
      );
      return `Warned ${command.login}`;
    }
    case 'announce': {
      await twitchService.sendChatAnnouncement(
        broadcasterId,
        moderatorId,
        command.message,
      );
      return 'Announcement sent';
    }
    case 'shoutout': {
      const userId = await resolveUserId(command.login);
      await twitchService.sendShoutout(broadcasterId, userId, moderatorId);
      return `Shoutout sent for ${command.login}`;
    }
    case 'chatMode': {
      await twitchService.updateChatSettings(
        broadcasterId,
        moderatorId,
        command.patch,
      );
      return `${command.label} applied`;
    }
    case 'shield': {
      await twitchService.updateShieldMode(
        broadcasterId,
        moderatorId,
        command.active,
      );
      return command.active ? 'Shield mode enabled' : 'Shield mode disabled';
    }
  }
}
