import { recentMessagesService } from '@app/services/recent-messages-service';
import { restoreRecentMessagesForChannel } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { logger } from '@app/utils/logger';
import { MutableRefObject, useEffect, useRef } from 'react';

export function useRecentChatMessages({
  channelId,
  channelName,
  forceFlush,
  handleRecentIrcMessage,
  isLoadingRecentMessagesRef,
  scrollToBottom,
  showRecentMessages,
}: {
  channelId: string;
  channelName: string;
  forceFlush: () => void;
  handleRecentIrcMessage: (line: string) => Promise<void>;
  isLoadingRecentMessagesRef: MutableRefObject<boolean>;
  scrollToBottom: () => void;
  showRecentMessages: boolean;
}) {
  const restoredRecentCountRef = useRef(0);

  useEffect(() => {
    chatStore$.currentChannelId.set(channelId);
    const restoredCount = restoreRecentMessagesForChannel(channelId);
    restoredRecentCountRef.current = restoredCount;
    if (restoredCount > 0 && !showRecentMessages) {
      scrollToBottom();
    }
  }, [channelId, scrollToBottom, showRecentMessages]);

  useEffect(() => {
    if (!showRecentMessages) {
      isLoadingRecentMessagesRef.current = false;
      return;
    }

    const abortController = new AbortController();
    isLoadingRecentMessagesRef.current = true;

    const loadRecentMessages = async () => {
      try {
        const recentMessages = await recentMessagesService.getRecentMessages(
          channelName,
          abortController.signal,
        );

        for (const message of recentMessages) {
          if (abortController.signal.aborted) {
            return;
          }
          // oxlint-disable-next-line no-await-in-loop -- Recent messages must replay in server order.
          await handleRecentIrcMessage(message);
        }

        forceFlush();
        scrollToBottom();
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.chat.debug('Failed to load recent messages:', error);
          if (restoredRecentCountRef.current > 0) {
            scrollToBottom();
          }
        }
      } finally {
        if (!abortController.signal.aborted) {
          isLoadingRecentMessagesRef.current = false;
        }
      }
    };

    void loadRecentMessages();

    return () => {
      abortController.abort();
      isLoadingRecentMessagesRef.current = false;
    };
  }, [
    channelName,
    forceFlush,
    handleRecentIrcMessage,
    isLoadingRecentMessagesRef,
    scrollToBottom,
    showRecentMessages,
  ]);
}
