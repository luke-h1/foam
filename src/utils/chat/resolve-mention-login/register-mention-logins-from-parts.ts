import type { ParsedPart } from '@app/utils/chat/parsed-part';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/register-mention-login';

export function registerMentionLoginsFromParts(parts: ParsedPart[]): void {
  parts.forEach(part => {
    if (part.type !== 'mention' || !('content' in part)) {
      return;
    }

    registerMentionLogin(part.content.replace(/^@/, ''));
  });
}
