import { useCallback, useRef } from 'react';

import { createSystemMessage } from '@app/components/Chat/util/messageHandlers';
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
  chatDensity: 'comfortable' | 'compact';
  forceFlush: () => void;
  joinChannel: (channel: string) => void;
  partChannel: (channel: string) => void;
  refetchEmotes: () => Promise<unknown>;
  reprocessAllMessages: () => void;
  scrollToBottom: () => void;
  updatePreferences: (patch: Record<string, unknown>) => void;
}

function handleClearSevenTvCosmeticsCache() {
  try {
    clearUserCosmeticsCache();
    logger.chat.info('7TV cosmetic cache cleared successfully');
  } catch (error) {
    logger.chat.error('Failed to clear 7TV cosmetic cache:', error);
  }
}

export function useChatSettingsActions({
  channelId,
  channelName,
  chatDensity,
  forceFlush,
  joinChannel,
  partChannel,
  refetchEmotes,
  reprocessAllMessages,
  scrollToBottom,
  updatePreferences,
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

  const updatePreferencesRef = useRef(updatePreferences);
  updatePreferencesRef.current = updatePreferences;

  const chatDensityRef = useRef(chatDensity);
  chatDensityRef.current = chatDensity;

  const handleClearChatCache = useCallback(() => {
    try {
      clearCache(channelId);
      logger.chat.info('Chat cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear chat cache:', error);
    }
  }, [channelId]);

  const handleClearImageCache = useCallback(async () => {
    try {
      await clearImageCache(channelId);
      logger.chat.info('Image cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear image cache:', error);
    }
  }, [channelId]);

  const handleDebugClearImageCache = useCallback(() => {
    void handleClearImageCache();
  }, [handleClearImageCache]);

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
        await clearImageCache(channelId);
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

  const handleToggleChatDensity = useCallback(() => {
    updatePreferencesRef.current({
      chatDensity:
        chatDensityRef.current === 'compact' ? 'comfortable' : 'compact',
    });
  }, []);

  const handleToggleHighlightOwnMentions = useCallback((value: boolean) => {
    updatePreferencesRef.current({ highlightOwnMentions: value });
  }, []);

  const handleToggleInlineReplyContext = useCallback((value: boolean) => {
    updatePreferencesRef.current({ showInlineReplyContext: value });
  }, []);

  const handleToggleShowTimestamps = useCallback((value: boolean) => {
    updatePreferencesRef.current({ chatTimestamps: value });
  }, []);

  const handleToggleShowUnreadJumpPill = useCallback((value: boolean) => {
    updatePreferencesRef.current({ showUnreadJumpPill: value });
  }, []);

  return {
    handleClearChatCache,
    handleDebugClearImageCache,
    handleClearSevenTvCosmeticsCache,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleRefreshCommand,
    handleToggleChatDensity,
    handleToggleHighlightOwnMentions,
    handleToggleInlineReplyContext,
    handleToggleShowTimestamps,
    handleToggleShowUnreadJumpPill,
  };
}
