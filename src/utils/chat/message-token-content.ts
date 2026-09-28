import type { MessageToken } from './message-token';

export function getMessageTokenText(token: MessageToken): string {
  if (!('content' in token)) {
    return '';
  }

  const { content } = token;
  return String(content) === content ? content : '';
}
