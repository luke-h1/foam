import { useCallback } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';
import i18next from '@app/i18n/i18next';
import {
  clearCache,
  invalidateChannelCache,
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

  const handleSettingsRefetchEmotes = useCallback(() => {
    void (async () => {
      try {
        invalidateChannelCache(channelId);
        await refetchEmotesRef.current();
        reprocessAllMessagesRef.current();
        announceRefresh();
      } catch (error) {
        logger.chat.error('Failed to refetch emotes:', error);
      }
    })();
  }, [announceRefresh, channelId, refetchEmotesRef, reprocessAllMessagesRef]);

  const handleRefreshCommand = useCallback(() => {
    void (async () => {
      try {
        invalidateChannelCache(channelId);
        clearUserCosmeticsCache();
        await clearImageCache();
        await refetchEmotesRef.current();
        reprocessAllMessagesRef.current();
        announceRefresh();
      } catch (error) {
        logger.chat.error('Failed to run refresh command:', error);
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
    handleResumeScrollToBottom,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleRefreshCommand,
  };
}
