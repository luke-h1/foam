import { recentMessagesService } from '@app/services/recent-messages-service';
import { restoreRecentMessagesForChannel } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { logger } from '@app/utils/logger';
import { MutableRefObject, useEffect, useRef } from 'react';

export function useRecentChatMessages({
  channelId,
  channelName,
  forceFlush,
  processRecentIrcLine,
  isLoadingRecentMessagesRef,
  scrollChatToEnd,
  showRecentMessages,
}: {
  channelId: string;
  channelName: string;
  forceFlush: () => void;
  processRecentIrcLine: (line: string) => Promise<void>;
  isLoadingRecentMessagesRef: MutableRefObject<boolean>;
  scrollChatToEnd: () => void;
  showRecentMessages: boolean;
}) {
  const restoredRecentCountRef = useRef(0);
  const scrollChatToEndRef = useRef(scrollChatToEnd);
  const processRecentIrcLineRef = useRef(processRecentIrcLine);
  const forceFlushRef = useRef(forceFlush);
  const showRecentMessagesRef = useRef(showRecentMessages);

  scrollChatToEndRef.current = scrollChatToEnd;
  processRecentIrcLineRef.current = processRecentIrcLine;
  forceFlushRef.current = forceFlush;
  showRecentMessagesRef.current = showRecentMessages;

  useEffect(() => {
    chatStore$.currentChannelId.set(channelId);
    const restoredCount = restoreRecentMessagesForChannel(channelId);
    restoredRecentCountRef.current = restoredCount;
    if (restoredCount > 0 && !showRecentMessagesRef.current) {
      scrollChatToEndRef.current();
    }
  }, [channelId]);

  useEffect(() => {
    if (!showRecentMessagesRef.current) {
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
          // Recent messages must replay in server order.
          // eslint-disable-next-line react-doctor/async-await-in-loop -- IRC replay order is required
          await processRecentIrcLineRef.current(message);
        }

        forceFlushRef.current();
        scrollChatToEndRef.current();
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.chat.debug('Failed to load recent messages:', error);
          if (restoredRecentCountRef.current > 0) {
            scrollChatToEndRef.current();
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
  }, [channelName, isLoadingRecentMessagesRef, showRecentMessages]);
}
