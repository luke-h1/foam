import { useState } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

import {
  type ChatIngestController,
  createChatIngestController,
} from '../util/chatIngestController';
import { type BufferedMessage } from '../util/messageBuffer';
import type { ChatScrollAnchor } from './useChatScroll';

interface UseChatMessagesOptions {
  /**
   * Applied to each message as it leaves the buffer for the store, so the
   * live path can defer emote/badge parsing to commit time.
   */
  finalizeMessageForCommit?: (message: BufferedMessage) => BufferedMessage;
  /**
   * Hold live messages this many ms before the render buffer (default 0 = no
   * delay).
   */
  getChatDelayMs?: () => number;
  scrollAnchor: ChatScrollAnchor;
}

/**
 * React adapter over the ingest controller: pins its lifetime to the
 * component and keeps dependency reads pointed at the latest render's options.
 */
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
