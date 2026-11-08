import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';

export function isLoginInList(
  login: string | null | undefined,
  logins: readonly string[],
): boolean {
  const normalised = normaliseChatUsername(login);

  if (!normalised) {
    return false;
  }

  return logins.some(entry => normaliseChatUsername(entry) === normalised);
}
