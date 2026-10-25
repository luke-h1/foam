import { pendingLogins } from '@app/utils/chat/mention-login-resolver/pendingLogins';
import { scheduleMentionLoginFlush } from '@app/utils/chat/mention-login-resolver/scheduleMentionLoginFlush';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';

function extractTwitchLogin(value: string): string {
  return value.match(/^([a-zA-Z0-9_]{1,25})(?![a-zA-Z0-9_])/)?.[1] ?? '';
}

function queueMentionLoginLookup(login?: string | null): void {
  const trimmed = extractTwitchLogin(login?.trim() ?? '');

  if (!trimmed) {
    return;
  }

  if (trimmed !== trimmed.toLowerCase()) {
    registerMentionLogin(trimmed);
    return;
  }

  const canonical = getMentionLogin(trimmed);

  if (canonical !== trimmed.toLowerCase()) {
    return;
  }

  pendingLogins.add(trimmed.toLowerCase());
  scheduleMentionLoginFlush();
}

export function queueMentionLoginsFromParts(
  tokens: { type: string; content?: string }[],
): void {
  tokens.forEach(token => {
    if (token.type !== 'mention' || !token.content) {
      return;
    }

    queueMentionLoginLookup(token.content.replace(/^@/, ''));
  });
}
