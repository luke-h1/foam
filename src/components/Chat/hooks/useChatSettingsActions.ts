import { useCallback } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';
import i18next from '@app/i18n/i18next';
import {
  clearCache,
  invalidateChatResourceCaches,
} from '@app/store/chat/actions/channelLoad';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { addMessage } from '@app/store/chat/actions/messages';
import { createSystemMessage } from '@app/utils/chat/messageHandlers/createSystemMessage';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';

interface UseChatSettingsActionsOptions {
  channelId: string;
  channelName: string;
  forceFlush: () => void;
  joinChannel: (channel: string) => void;
  partChannel: (channel: string) => void;
  refetchEmotes: () => Promise<unknown>;
  reprocessAllMessages: () => void;
  scrollToBottom: () => void;
}

function handleClearSevenTvCosmeticsCache() {
  clearUserCosmeticsCache();
  logger.chat.info('7TV cosmetic cache cleared successfully');
}

export function useChatSettingsActions({
  channelId,
  channelName,
  forceFlush,
  joinChannel,
  partChannel,
  refetchEmotes,
  reprocessAllMessages,
  scrollToBottom,
}: UseChatSettingsActionsOptions) {
  const channelNameRef = useSyncRef(channelName);
  const refetchEmotesRef = useSyncRef(refetchEmotes);
  const reprocessAllMessagesRef = useSyncRef(reprocessAllMessages);
  const partChannelRef = useSyncRef(partChannel);
  const joinChannelRef = useSyncRef(joinChannel);

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
        i18next.t('chat:emotesRefreshed'),
      ),
    );
  }, [channelNameRef]);

  /**
   * Backs both the settings sheet's "Refetch Emotes & Badges" row and the
   * `/refresh` command - one user-facing action, so both drop every cache the
   * reload could otherwise be served from rather than only the channel's.
   */
  const handleRefreshEmotesAndBadges = useCallback(() => {
    void (async () => {
      try {
        invalidateChatResourceCaches(channelId);
        clearUserCosmeticsCache();
        await clearImageCache();
        await refetchEmotesRef.current();
        reprocessAllMessagesRef.current();
        announceRefresh();
      } catch (error) {
        logger.chat.error('Failed to refresh emotes and badges:', error);
      }
    })();
  }, [announceRefresh, channelId, refetchEmotesRef, reprocessAllMessagesRef]);

  const handleSettingsReconnect = useCallback(() => {
    partChannelRef.current(channelNameRef.current);
    setTimeout(() => {
      joinChannelRef.current(channelNameRef.current);
    }, 1000);
  }, [channelNameRef, joinChannelRef, partChannelRef]);

  return {
    handleClearChatCache,
    handleClearImageCache,
    handleClearSevenTvCosmeticsCache,
    handleRefreshEmotesAndBadges,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
  };
}
