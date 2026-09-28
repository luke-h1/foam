import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/register-mention-login';

export function registerMentionLoginsFromSender(
  login?: string | null,
  displayName?: string | null,
): void {
  const normalisedLogin = normaliseChatUsername(login);
  const display = displayName?.trim();

  if (!normalisedLogin || !display) {
    return;
  }

  if (display.toLowerCase() === normalisedLogin) {
    registerMentionLogin(display);
  }
}
