import type { MessageToken } from '@app/types/chat/messageToken';
import { stripMentionPrefix } from '@app/utils/chat/chat-usernames/stripMentionPrefix';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';

export function applyMentionLoginCasing(
  tokens: MessageToken[],
): MessageToken[] {
  let nextParts: MessageToken[] | null = null;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (!token || token.type !== 'mention') {
      continue;
    }

    const login = stripMentionPrefix(token.content);
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
