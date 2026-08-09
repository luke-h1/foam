import { ParsedPart } from '@app/utils/chat/parsedPart';

export function hasRenderableNoticeBody(
  part: ParsedPart<'modiversary' | 'viewermilestone'>,
): boolean {
  return Boolean(part.systemMsg.trim() || part.content.trim());
}
