import type { ParsedPart } from '@app/utils/chat/parsed-part';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/get-mention-login';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/register-mention-login';

export function applyMentionLoginCasing(parts: ParsedPart[]): ParsedPart[] {
  let nextParts: ParsedPart[] | null = null;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];

    if (!part || part.type !== 'mention' || !('content' in part)) {
      continue;
    }

    const login = part.content.replace(/^@/, '').trim();
    registerMentionLogin(login);

    const canonicalLogin = getMentionLogin(login);
    const content = `@${canonicalLogin}`;

    if (content === part.content) {
      continue;
    }

    if (!nextParts) {
      nextParts = parts.slice();
    }

    nextParts[i] = { ...part, content };
  }

  return nextParts ?? parts;
}
