import type { MessageToken } from '@app/types/chat/messageToken';

export function getMessageTokenText(token: MessageToken): string {
  if (!('content' in token)) {
    return '';
  }

  const { content } = token;
  return String(content) === content ? content : '';
}
