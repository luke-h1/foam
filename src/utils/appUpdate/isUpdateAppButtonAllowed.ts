import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';

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
