import { scanChatBody } from '@app/utils/chat/derive-chat-body/scan-chat-body';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * Decides whether a body can render inside a single Text element. Add new
 * inline-breaking cases here, not at a call site.
 *
 * Callers ask about a row (username and body together), a body on its own,
 * or a reply quote, and each caller's variable name says which.
 */
export function flowsInline(
  message: MessageToken[],
  options: { hasPaint: boolean; isModerated: boolean },
): message is InlineFlowToken[] {
  if (options.hasPaint || options.isModerated) {
    return false;
  }

  return scanChatBody(message).fitsInOneText;
}
