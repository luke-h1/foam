import i18next from 'i18next';
import { toast } from 'sonner-native';

import { logger } from '@app/utils/logger';

import { executeModCommand } from './executeModCommand';
import type { ModCommand } from './modCommands';

/**
 * Fire-and-forget wrapper shared by the composer and the chat action sheets:
 * runs a parsed moderation command against Helix and surfaces the outcome as
 * a success/failure toast.
 */
export function runModCommand(
  command: ModCommand,
  channelId: string,
  currentUserId: string | undefined,
): void {
  const moderatorId = currentUserId?.trim();
  if (!moderatorId) {
    toast.error(i18next.t('chat:modCommands.failed'));
    return;
  }
  executeModCommand(command, { broadcasterId: channelId, moderatorId })
    .then(successMessage => toast.success(successMessage))
    .catch((error: unknown) => {
      logger.chat.warn('Mod command failed', {
        error,
        command: command.type,
        channel_id: channelId,
      });
      toast.error(i18next.t('chat:modCommands.failed'));
    });
}
