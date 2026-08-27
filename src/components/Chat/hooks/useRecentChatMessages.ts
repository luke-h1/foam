import { MutableRefObject, useEffect, useRef } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { recentMessagesService } from '@app/services/recent-messages-service';
import {
  getMaxChatMessages,
  restoreRecentMessagesForChannel,
} from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { logger } from '@app/utils/logger';

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
  const scrollChatToEndRef = useSyncRef(scrollChatToEnd);
  const processRecentIrcLineRef = useSyncRef(processRecentIrcLine);
  const forceFlushRef = useSyncRef(forceFlush);
  const showRecentMessagesRef = useSyncRef(showRecentMessages);

  useEffect(() => {
    chatStore$.currentChannelId.set(channelId);
    const restoredCount = restoreRecentMessagesForChannel(channelId);
    restoredRecentCountRef.current = restoredCount;
    if (restoredCount > 0 && !showRecentMessagesRef.current) {
      scrollChatToEndRef.current();
    }
  }, [channelId, scrollChatToEndRef, showRecentMessagesRef]);

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
          getMaxChatMessages(),
        );

        for (const message of recentMessages) {
          if (abortController.signal.aborted) {
            return;
          }
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
      }

      if (!abortController.signal.aborted) {
        isLoadingRecentMessagesRef.current = false;
      }
    };

    void loadRecentMessages();

    return () => {
      abortController.abort();
      isLoadingRecentMessagesRef.current = false;
    };
  }, [
    channelName,
    forceFlushRef,
    isLoadingRecentMessagesRef,
    processRecentIrcLineRef,
    scrollChatToEndRef,
    showRecentMessages,
    showRecentMessagesRef,
  ]);
}
