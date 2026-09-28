import { MessageToken } from '@app/utils/chat/message-token';

export function hasRenderableNoticeBody(
  token: MessageToken<'modiversary' | 'viewermilestone'>,
): boolean {
  return Boolean(token.systemMsg.trim() || token.content.trim());
}
