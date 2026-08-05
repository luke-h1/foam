import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';

/**
 * Gate for the "update app" button in Settings.
 *
 * An empty allow-list means the button is visible to everyone. Otherwise only
 * Twitch logins on the list can see it.
 */
export function isUpdateAppButtonAllowed(
  login: string | null | undefined,
  allowedUsers: readonly string[],
): boolean {
  if (allowedUsers.length === 0) {
    return true;
  }

  const normalised = normaliseChatUsername(login);

  if (!normalised) {
    return false;
  }

  return allowedUsers.some(user => normaliseChatUsername(user) === normalised);
}
