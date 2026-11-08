import { useState } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';

import type { BufferedMessage } from '../util/buffered-message-ops/types';
import {
  type ChatIngestController,
  createChatIngestController,
} from '../util/chatIngestController';
import { isRowTouchHeld } from '../util/chatRowTouchHold';
import type { ChatScrollAnchor } from './use-chat-scroll';

interface UseChatMessagesOptions {
  /**
   * Applied to each message as it leaves the buffer for the store, so the
   * live path can defer emote/badge parsing to commit time.
   */
  finalizeMessageForCommit?: (message: BufferedMessage) => BufferedMessage;
  getChatDelayMs?: () => number;
  scrollAnchor: ChatScrollAnchor;
}

export const useChatMessages = (
  options: UseChatMessagesOptions,
): ChatIngestController => {
  const optionsRef = useSyncRef(options);

  const [controller] = useState(() =>
    createChatIngestController({
      getFinalizeMessageForCommit: () =>
        optionsRef.current.finalizeMessageForCommit,
      getChatDelayMs: () => optionsRef.current.getChatDelayMs?.() ?? 0,
      isAtBottom: () => optionsRef.current.scrollAnchor.isAtBottomRef.current,
      isRowTouchHeld,
      isScrollingToBottom: () =>
        optionsRef.current.scrollAnchor.isScrollingToBottomRef.current,
      isUserActivelyScrolling: () =>
        optionsRef.current.scrollAnchor.isUserActivelyScrolling(),
      onBottomContentChange: () => {
        optionsRef.current.scrollAnchor.maintainBottomAfterContentChange();
      },
    }),
  );

  return controller;
};
