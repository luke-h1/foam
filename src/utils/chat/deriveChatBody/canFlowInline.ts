import { scanChatBody } from '@app/utils/chat/deriveChatBody/scanChatBody';
import type { InlineFlowPart } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * The one answer to "can this body live inside a single Text element". A
 * painted username is rendered through a mask and a moderated body carries a
 * strike overlay, so neither can share a Text with the message - they belong
 * in the policy here rather than being re-ANDed at each call site.
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
