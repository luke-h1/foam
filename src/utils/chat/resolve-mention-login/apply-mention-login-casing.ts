import type { MessageToken } from '@app/utils/chat/message-token';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/get-mention-login';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/register-mention-login';

export function applyMentionLoginCasing(
  tokens: MessageToken[],
): MessageToken[] {
  let nextParts: MessageToken[] | null = null;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (!token || token.type !== 'mention' || !('content' in token)) {
      continue;
    }

    const login = token.content.replace(/^@/, '').trim();
    registerMentionLogin(login);

    const canonicalLogin = getMentionLogin(login);
    const content = `@${canonicalLogin}`;

    if (content === token.content) {
      continue;
    }

    if (!nextParts) {
      nextParts = tokens.slice();
    }

    nextParts[i] = { ...token, content };
  }

  return nextParts ?? tokens;
}
