import { scanChatBody } from '@app/utils/chat/deriveChatBody/scanChatBody';
import type { InlineFlowPart } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * The one answer to "can this body live inside a single Text element";
 * inline-breaking cases live here, never re-ANDed at call sites.
 */
export function canFlowInline(
  message: ParsedPart[],
  options: { hasPaint: boolean; isModerated: boolean },
): message is InlineFlowPart[] {
  if (options.hasPaint || options.isModerated) {
    return false;
  }

  return scanChatBody(message).canBeInline;
}
