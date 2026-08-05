import { formatTimeoutDuration } from '@app/components/Chat/util/formatModerationSystemMessage/formatTimeoutDuration';

/**
 * Announcement line for a CLEARCHAT moderation action. A `banDuration` (seconds)
 * is a timeout; its absence is a permanent ban.
 */
export function formatModerationSystemMessage(
  username: string,
  banDuration?: number,
): string {
  if (banDuration != null) {
    return `${username} has been timed out for ${formatTimeoutDuration(banDuration)}`;
  }

  return `${username} has been permanently banned`;
}
