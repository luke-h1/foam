import type { MessageToken } from '@app/utils/chat/messageToken';

export function getTokenIdentity(token: MessageToken, index: number): string {
  return `${token.type}-${index}`;
}
