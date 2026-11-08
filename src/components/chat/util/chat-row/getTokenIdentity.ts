import type { MessageToken } from '@app/types/chat/messageToken';

export function getTokenIdentity(token: MessageToken, index: number): string {
  return `${token.type}-${index}`;
}
