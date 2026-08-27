import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';

/**
 * An empty allow-list shows the Settings "update app" button to everyone;
 * otherwise only Twitch logins on the list see it.
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
