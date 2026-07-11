import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';

export function registerMentionLoginsFromParts(parts: ParsedPart[]): void {
  parts.forEach(part => {
    if (part.type !== 'mention' || !('content' in part)) {
      return;
    }

    registerMentionLogin(part.content.replace(/^@/, ''));
  });
}
