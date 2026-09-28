import type { MessageToken } from '@app/utils/chat/message-token';

export function getTokenIdentity(token: MessageToken, index: number): string {
  return `${token.type}-${index}`;
}
