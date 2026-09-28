import { scanChatBody } from '@app/utils/chat/derive-chat-body/scan-chat-body';
import type { InlineFlowPart } from '@app/utils/chat/derive-chat-body/types';
import type { ParsedPart } from '@app/utils/chat/parsed-part';

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
