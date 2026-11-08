import { useCallback } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import {
  clearCache,
  invalidateChatResourceCaches,
} from '@app/store/chat/actions/channel-load';
import { resetChannelSession } from '@app/store/chat/actions/channel-session';
import { addMessage } from '@app/store/chat/actions/messages';
import { getPreferences } from '@app/store/preference-store';
import { createSystemMessage } from '@app/utils/chat/message-handlers/createSystemMessage';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';

interface UseChatSettingsActionsOptions {
  channelId: string;
  channelName: string;
  forceFlush: () => void;
  reconnect: () => void;
  refetchEmotes: () => Promise<void>;
  reprocessAllMessages: () => void;
  scrollToBottom: () => void;
}

function handleClearSevenTvCosmeticsCache() {
  resetChannelSession('clear-cosmetics');
  logger.chat.info('7TV cosmetic cache cleared successfully');
}

export function useChatSettingsActions({
  channelId,
  channelName,
  forceFlush,
  reconnect,
  refetchEmotes,
  reprocessAllMessages,
  scrollToBottom,
}: UseChatSettingsActionsOptions) {
  const channelNameRef = useSyncRef(channelName);
  const refetchEmotesRef = useSyncRef(refetchEmotes);
  const reprocessAllMessagesRef = useSyncRef(reprocessAllMessages);

  const handleClearChatCache = useCallback(() => {
    clearCache(channelId);
    logger.chat.info('Chat cache cleared successfully');
  }, [channelId]);

  const handleClearImageCache = useCallback(() => {
    void (async () => {
      try {
        await clearImageCache();
        logger.chat.info('Image cache cleared successfully');
      } catch (error) {
        logger.chat.error('Failed to clear image cache:', error);
      }
    })();
  }, []);

  const handleResumeScrollToBottom = useCallback(() => {
    forceFlush();
    scrollToBottom();
  }, [forceFlush, scrollToBottom]);

  const announceRefresh = useCallback(() => {
    addMessage(
      createSystemMessage(
        channelNameRef.current,
        'Refreshed emotes and badges',
        getPreferences().chatTimestampFormat,
      ),
    );
  }, [channelNameRef]);

  const handleRefreshEmotesAndBadges = useCallback(() => {
    void (async () => {
      try {
        invalidateChatResourceCaches(channelId);
        resetChannelSession('clear-cosmetics');
        await clearImageCache();
        await refetchEmotesRef.current();
        reprocessAllMessagesRef.current();
        announceRefresh();
      } catch (error) {
        logger.chat.error('Failed to refresh emotes and badges:', error);
      }
    })();
  }, [announceRefresh, channelId, refetchEmotesRef, reprocessAllMessagesRef]);

  return {
    handleClearChatCache,
    handleClearImageCache,
    handleClearSevenTvCosmeticsCache,
    handleRefreshEmotesAndBadges,
    handleResumeScrollToBottom,
    handleSettingsReconnect: reconnect,
  };
}
