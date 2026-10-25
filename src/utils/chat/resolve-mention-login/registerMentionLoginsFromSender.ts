import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';

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
