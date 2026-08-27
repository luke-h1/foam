import { toast } from 'sonner-native';

import type { LogMetadataValue } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import { executeModCommand } from './executeModCommand';
import type { ModCommand } from './parseModCommand';

/**
 * Fire-and-forget wrapper: runs a parsed moderation command against Helix and
 * shows the outcome as a success/failure toast.
 */
export function runModCommand(
  command: ModCommand,
  channelId: string,
  currentUserId: string | undefined,
): void {
  const moderatorId = currentUserId?.trim();
  if (!moderatorId) {
    toast.error('Moderation action failed');
    return;
  }
  executeModCommand(command, { broadcasterId: channelId, moderatorId })
    .then(successMessage => toast.success(successMessage))
    .catch((error: LogMetadataValue) => {
      logger.chat.warn('Mod command failed', {
        error,
        command: command.type,
        channel_id: channelId,
      });
      toast.error('Moderation action failed');
    });
}
