import { scanChatBody } from '@app/utils/chat/derive-chat-body/scan-chat-body';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * The one answer to "can this body live inside a single Text element".
 * Inline-breaking cases live here, never re-ANDed at a call site.
 *
 * Callers ask it about different things, so each names what it asked:
 * a row (username and body together), a body on its own, or a reply quote.
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
