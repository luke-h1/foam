import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@app/context/AuthContext';
import { setChatFrontTrimSuspended } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  useChatRenderPreferences,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type { ChatListRef } from '../components/ChatList';
import { useChatScroll } from './useChatScroll';
import { useChatSession } from './useChatSession';
import { useChatSurface } from './useChatSurface';
import { useChatTransientState } from './useChatTransientState';

export function useChat(
  channelId: string,
  channelName: string,
  // DEV/perf only (Chat Perf screen): when true, the live Twitch transports are
  // not connected and the synthetic flood is the only message source, for a
  // deterministic replay independent of the channel being live.
  syntheticTransport = false,
) {
  const { user } = useAuthContext();
  const preferences = useChatRenderPreferences();
  const updatePreferences = useUpdatePreferences();
  const blockedTerms = usePreference('blockedTerms');
  const insets = useSafeAreaInsets();
  const messages$ = chatStore$.messages;
  const currentUsername = user?.login ?? user?.display_name;

  const {
    handleClearFilters,
    handleToggleShowOnlyMentions,
    hiddenPhrases,
    hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    hydratedVisibleAssetKeysRef,
    pendingVisibleMessagesRef,
    setHighlightedReplyTargetMessageId,
    showOnlyMentions,
    toggleHighlightedUser,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  } = useChatTransientState(channelId);
  const listRef = useRef<ChatListRef | null>(null);
  const inputShellRef = useRef<ChatInputShellHandle>(null);

  const getMessagesLength = useCallback(
    () => messages$.peek().length,
    [messages$],
  );

  const {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    shouldMaintainScrollAtEnd,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollBegin,
    handleMomentumScrollEnd,
    handleEndReached,
    handleContentSizeChange,
    scrollToBottom,
    maintainBottomAfterContentChange,
    cleanup: cleanupScroll,
  } = useChatScroll({
    listRef,
    getMessagesLength,
  });

  // While scrolled up (maintainVisibleContentPosition active) pause front-trim
  // of the message window so removing the oldest rows can't re-anchor the list
  // to the top; trimming resumes when the user returns to the bottom.
  useEffect(() => {
    setChatFrontTrimSuspended(!shouldMaintainScrollAtEnd);
    return () => {
      setChatFrontTrimSuspended(false);
    };
  }, [shouldMaintainScrollAtEnd]);

  const {
    connected,
    emoteLoadStatus,
    fetchUserCosmetics,
    forceFlush,
    getUserState,
    handleViewableMessagesChange,
    isChatConnected,
    joinChannel,
    partChannel,
    processedMessageIdsRef,
    processMessageEmotes,
    refetchEmotes,
    reprocessAllMessages,
    sendChatCommand,
    sendMessage,
    twitchConnectionState,
  } = useChatSession({
    channelId,
    channelName,
    cleanupScroll,
    hydratedVisibleAssetKeysRef,
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    listRef,
    maintainBottomAfterContentChange,
    pendingVisibleMessagesRef,
    preferences,
    scrollToBottom,
    setUnreadCount,
    syntheticTransport,
    user,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  });

  const {
    appendMentionToComposer,
    canModerateChat,
    chatAssetPreferenceKey,
    getItemType,
    handleClearChatCache,
    handleClearSevenTvCosmeticsCache,
    handleDebugClearImageCache,
    handleEmoteSelect,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handlePinMessage,
    handlePinnedMessageChanged,
    handleRefreshCommand,
    handleRefreshPinnedMessage,
    handleReply,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleToggleChatDensity,
    handleToggleHighlightOwnMentions,
    handleToggleInlineReplyContext,
    handleToggleShowTimestamps,
    handleToggleShowUnreadJumpPill,
    handleUnpinPinnedMessage,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    overlaysElement,
    paneFlags,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    renderItem,
  } = useChatSurface({
    channelId,
    channelName,
    fetchUserCosmetics,
    forceFlush,
    getUserState,
    hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    inputShellRef,
    joinChannel,
    listRef,
    partChannel,
    preferences,
    refetchEmotes,
    reprocessAllMessages,
    scrollToBottom,
    setHighlightedReplyTargetMessageId,
    shouldMaintainScrollAtEnd,
    showOnlyMentions,
    toggleHighlightedUser,
    twitchConnectionState,
    updatePreferences,
    user,
  });

  // Stable identity: a fresh array here breaks ChatMessagePane's memo on every
  // render and re-runs the visible-message filter over the whole list.
  const combinedHiddenPhrases = useMemo(
    () => [...hiddenPhrases, ...blockedTerms],
    [hiddenPhrases, blockedTerms],
  );

  return {
    appendMentionToComposer,
    canModerateChat,
    channelId,
    channelName,
    chatAssetPreferenceKey,
    connected,
    currentUsername,
    emoteLoadStatus,
    getItemType,
    getUserState,
    handleClearChatCache,
    handleClearFilters,
    handleClearSevenTvCosmeticsCache,
    handleContentSizeChange,
    handleDebugClearImageCache,
    handleEmoteSelect,
    handleEndReached,
    handleMomentumScrollBegin,
    handleMomentumScrollEnd,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handlePinnedMessageChanged,
    handlePinMessage,
    handleRefreshPinnedMessage,
    handleReply,
    handleResumeScrollToBottom,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleToggleChatDensity,
    handleToggleHighlightOwnMentions,
    handleToggleInlineReplyContext,
    handleToggleShowTimestamps,
    handleToggleShowUnreadJumpPill,
    handleToggleShowOnlyMentions,
    handleUnpinPinnedMessage,
    handleViewableMessagesChange,
    hiddenPhrases: combinedHiddenPhrases,
    hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedUsers,
    insets,
    inputShellRef,
    isAtBottom,
    isChatConnected,
    isScrollingToBottom,
    keyExtractor,
    listContentStyle,
    listRef,
    messageListExtraData,
    messages$,
    overlaysElement,
    paneFlags,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    preferences,
    processedMessageIdsRef,
    processMessageEmotes,
    handleRefreshCommand,
    renderItem,
    sendChatCommand,
    sendMessage,
    shouldMaintainScrollAtEnd,
    showOnlyMentions,
    toggleHighlightedUser,
    twitchConnectionState,
    unreadCount,
    user,
  };
}
