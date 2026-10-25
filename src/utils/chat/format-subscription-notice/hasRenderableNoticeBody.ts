import type { MessageToken } from '@app/utils/chat/messageToken';

export function hasRenderableNoticeBody(
  token: MessageToken<'modiversary' | 'viewermilestone'>,
): boolean {
  return Boolean(token.systemMsg.trim() || token.content.trim());
}
