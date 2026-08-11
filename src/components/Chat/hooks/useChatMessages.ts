import { MutableRefObject } from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { useSyncRef } from '@app/hooks/useSyncRef';

import {
  type ChatIngestController,
  createChatIngestController,
} from '../util/chatIngestController';
import { type BufferedMessage } from '../util/messageBuffer';

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
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef?: MutableRefObject<boolean>;
  isUserActivelyScrolling?: () => boolean;
  onBottomContentChange?: () => void;
  onUnreadIncrement: (count: number) => void;
}

/**
 * React adapter over the ingest controller: the controller owns the state
 * machine (see `util/chatIngestController.ts`); this hook only pins its
 * lifetime to the component and keeps its dependency reads pointed at the
 * latest render's options.
 */
export const useChatMessages = (
  options: UseChatMessagesOptions,
): ChatIngestController => {
  const optionsRef = useSyncRef(options);

  const controllerRef = useLazyRef(() =>
    createChatIngestController({
      getFinalizeMessageForCommit: () =>
        optionsRef.current.finalizeMessageForCommit,
      getChatDelayMs: () => optionsRef.current.getChatDelayMs?.() ?? 0,
      isAtBottom: () => optionsRef.current.isAtBottomRef.current,
      isScrollingToBottom: () =>
        optionsRef.current.isScrollingToBottomRef?.current ?? false,
      isUserActivelyScrolling: () =>
        optionsRef.current.isUserActivelyScrolling?.() ?? false,
      onBottomContentChange: () => {
        optionsRef.current.onBottomContentChange?.();
      },
      onUnreadIncrement: count => {
        optionsRef.current.onUnreadIncrement(count);
      },
    }),
  );

  return controllerRef.current;
};
