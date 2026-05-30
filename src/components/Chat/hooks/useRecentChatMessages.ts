import { recentMessagesService } from '@app/services/recent-messages-service';
import { restoreRecentMessagesForChannel } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { logger } from '@app/utils/logger';
import { useEffect } from 'react';

export function useRecentChatMessages({
  channelId,
  channelName,
  forceFlush,
  handleRecentIrcMessage,
  scrollToBottom,
  showRecentMessages,
}: {
  channelId: string;
  channelName: string;
  forceFlush: () => void;
  handleRecentIrcMessage: (line: string) => Promise<void>;
  scrollToBottom: () => void;
  showRecentMessages: boolean;
}) {
  useEffect(() => {
    chatStore$.currentChannelId.set(channelId);
    const restoredCount = restoreRecentMessagesForChannel(channelId);
    if (restoredCount > 0) {
      scrollToBottom();
    }
  }, [channelId, scrollToBottom]);

  useEffect(() => {
    if (!showRecentMessages) {
      return;
    }

    const abortController = new AbortController();

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
        }
      }
    };

    void loadRecentMessages();

    return () => {
      abortController.abort();
    };
  }, [
    channelName,
    forceFlush,
    handleRecentIrcMessage,
    scrollToBottom,
    showRecentMessages,
  ]);
}
