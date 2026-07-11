import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';

export function registerMentionLoginsFromSender(
  login?: string | null,
  displayName?: string | null,
): void {
  const normalisedLogin = login?.trim().toLowerCase();
  const display = displayName?.trim();
  if (!normalisedLogin || !display) {
    return;
  }

  if (display.toLowerCase() === normalisedLogin) {
    registerMentionLogin(display);
  }
}
