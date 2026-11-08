import { isLoginInList } from '@app/utils/chat/chat-usernames/isLoginInList';

export function isUpdateAppButtonAllowed(
  login: string | null | undefined,
  allowedUsers: readonly string[],
): boolean {
  return allowedUsers.length === 0 || isLoginInList(login, allowedUsers);
}
