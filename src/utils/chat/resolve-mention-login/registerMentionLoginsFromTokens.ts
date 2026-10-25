import type { MessageToken } from '@app/utils/chat/messageToken';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';

export function registerMentionLoginsFromParts(tokens: MessageToken[]): void {
  tokens.forEach(token => {
    if (token.type !== 'mention') {
      return;
    }

    registerMentionLogin(token.content.replace(/^@/, ''));
  });
}
