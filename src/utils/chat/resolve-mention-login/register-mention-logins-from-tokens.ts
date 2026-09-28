import type { MessageToken } from '@app/utils/chat/message-token';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/register-mention-login';

export function registerMentionLoginsFromParts(tokens: MessageToken[]): void {
  tokens.forEach(token => {
    if (token.type !== 'mention' || !('content' in token)) {
      return;
    }

    registerMentionLogin(token.content.replace(/^@/, ''));
  });
}
