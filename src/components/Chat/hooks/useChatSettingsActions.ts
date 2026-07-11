import { useCallback, useRef } from 'react';

import { createSystemMessage } from '@app/components/Chat/util/messageHandlers/createSystemMessage';
import i18next from '@app/i18n/i18next';
import {
  clearCache,
  invalidateChannelCache,
} from '@app/store/chat/actions/channelLoad';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { addMessage } from '@app/store/chat/actions/messages';
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
  const channelNameRef = useRef(channelName);
  channelNameRef.current = channelName;

  const refetchEmotesRef = useRef(refetchEmotes);
  refetchEmotesRef.current = refetchEmotes;

  const reprocessAllMessagesRef = useRef(reprocessAllMessages);
  reprocessAllMessagesRef.current = reprocessAllMessages;

  const partChannelRef = useRef(partChannel);
  partChannelRef.current = partChannel;

  const joinChannelRef = useRef(joinChannel);
  joinChannelRef.current = joinChannel;

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
  }, []);

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
  }, [announceRefresh, channelId]);

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
  }, [announceRefresh, channelId]);

  const handleSettingsReconnect = useCallback(() => {
    partChannelRef.current(channelNameRef.current);
    setTimeout(() => {
      joinChannelRef.current(channelNameRef.current);
    }, 1000);
  }, []);

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
