import { clearCache } from '@app/store/chat/actions/channelLoad';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { usePreference, useUpdatePreferences } from '@app/store/preferences';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';
import { useRef, useCallback } from 'react';

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
  forceFlush,
  joinChannel,
  partChannel,
  refetchEmotes,
  reprocessAllMessages,
  scrollToBottom,
}: UseChatSettingsActionsOptions) {
  const chatDensity = usePreference('chatDensity');
  const updatePreferences = useUpdatePreferences();

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

  const handleSettingsRefetchEmotes = useCallback(() => {
    void refetchEmotesRef.current().then(() => {
      reprocessAllMessagesRef.current();
    });
  }, []);

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
    handleToggleChatDensity,
    handleToggleHighlightOwnMentions,
    handleToggleInlineReplyContext,
    handleToggleShowTimestamps,
    handleToggleShowUnreadJumpPill,
  };
}
