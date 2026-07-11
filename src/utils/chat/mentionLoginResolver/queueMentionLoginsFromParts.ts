import { pendingLogins } from '@app/utils/chat/mentionLoginResolver/pendingLogins';
import { scheduleMentionLoginFlush } from '@app/utils/chat/mentionLoginResolver/scheduleMentionLoginFlush';
import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin/getMentionLogin';
import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';

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
  parts: { type: string; content?: string }[],
): void {
  parts.forEach(part => {
    if (part.type !== 'mention' || !part.content) {
      return;
    }

    queueMentionLoginLookup(part.content.replace(/^@/, ''));
  });
}
