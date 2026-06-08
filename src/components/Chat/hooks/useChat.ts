import { useAuthContext } from '@app/context/AuthContext';
import { ReadyState } from '@app/hooks/ws/constants';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePreference } from '@app/store/preferences';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { useNavigation } from 'expo-router';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useTwitchChannelPointsEventSub } from '@app/hooks/useTwitchChannelPointsEventSub';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatInputShellHandle } from '../ChatInputShell';
import type { ChatListRef } from '../ChatMessagePane';
import type { ChatOverlaysHandle } from '../ChatOverlays';
import { normaliseChatUsername } from '../util/normaliseChatUsername';
import { useChatCosmetics } from './useChatCosmetics';
import { useChatEmoteLoader } from './useChatEmoteLoader';
import { useChatInteractionHandlers } from './useChatInteractionHandlers';
import { useChatIrcHandlers } from './useChatIrcHandlers';
import { useChatLifecycle } from './useChatLifecycle';
import { useChatMessageProcessing } from './useChatMessageProcessing';
import { useChatMessages } from './useChatMessages';
import { useChatRowRenderer } from './useChatRowRenderer';
import { useChatScroll } from './useChatScroll';
import { useChatSettingsActions } from './useChatSettingsActions';
import { useChatTransientState } from '@app/store/chat/react/transientState';
import { usePinnedChatMessage } from './usePinnedChatMessage';
import { useRecentChatMessages } from './useRecentChatMessages';
import { useSevenTvChatRuntime } from './useSevenTvChatRuntime';

export function useChat(channelId: string, channelName: string) {
  const { user } = useAuthContext();
  const showRecentMessages = usePreference('showRecentMessages');
  const chatTimestamps = usePreference('chatTimestamps');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const messages$ = chatStore$.messages;
  const currentUsername = user?.login ?? user?.display_name;

  const processedMessageIdsRef = useLazyRef(() => new Set<string>());

  useEffect(() => {
    registerMentionChatter({ login: channelName });
    registerMentionChatter({
      login: user?.login,
      userId: user?.id,
    });
  }, [channelName, user?.id, user?.login]);

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
  const chatOverlaysRef = useRef<ChatOverlaysHandle>(null);
  const isLoadingRecentMessagesRef = useRef(false);
  const isChatMountedRef = useRef(true);

  const { canFetchCosmetics, fetchedCosmeticsUsersRef, fetchUserCosmetics } =
    useChatCosmetics({
      channelId,
      userId: user?.id,
    });

  const {
    status: emoteLoadStatus,
    sevenTvEmoteSetId,
    refetch: refetchEmotes,
    cancel: cancelEmoteLoad,
  } = useChatEmoteLoader({
    channelId,
    enabled: true,
  });

  const getMessagesLength = useCallback(
    () => messages$.peek().length,
    [messages$],
  );

  const {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    isScrollingToBottomRef,
    shouldMaintainScrollAtEnd,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
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

  const {
    handleNewMessage,
    clearLocalMessages,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    removeBufferedMessageById,
    cleanup: cleanupMessages,
    forceFlush,
  } = useChatMessages({
    isAtBottomRef,
    isScrollingToBottomRef,
    onBottomContentChange: maintainBottomAfterContentChange,
    onUnreadIncrement: useCallback(
      (count: number) => setUnreadCount(prev => prev + count),
      [setUnreadCount],
    ),
  });

  const {
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  } = useChatMessageProcessing({
    channelId,
    fetchUserCosmetics,
    handleNewMessage,
    hydratedVisibleAssetKeysRef,
    isAtBottomRef,
    maintainBottomAfterContentChange,
    messages$,
    pendingVisibleMessagesRef,
    userLogin: user?.login,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  });

  const {
    handleRecentIrcMessage,
    onClearChat,
    onClearMessage,
    onJoin,
    onMessage,
    onNotice,
    onPart,
    onReconnect,
    onRoomState,
    onUserNotice,
  } = useChatIrcHandlers({
    channelId,
    channelName,
    clearLocalMessages,
    handleNewMessage,
    isMountedRef: isChatMountedRef,
    isLoadingRecentMessagesRef,
    listRef,
    messages$,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    processMessageEmotes,
    removeBufferedMessageById,
  });

  const {
    connectionState: twitchConnectionState,
    isConnected: isChatConnected,
    partChannel,
    joinChannel,
    sendMessage,
    sendChatCommand,
    sendAction,
    getUserState,
  } = useTwitchChat({
    channel: channelName,
    onMessage,
    onNotice,
    onUserNotice,
    onClearChat,
    onClearMessage,
    onReconnect,
    onRoomState,
    onJoin,
    onPart,
  });

  const { currentEmoteSetIdRef } = useChatLifecycle({
    navigation,
    channelId,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    fetchedCosmeticsUsersRef,
    isMountedRef: isChatMountedRef,
    processedMessageIdsRef,
  });

  useRecentChatMessages({
    channelId,
    channelName,
    forceFlush,
    processRecentIrcLine: handleRecentIrcMessage,
    isLoadingRecentMessagesRef,
    scrollChatToEnd: scrollToBottom,
    showRecentMessages,
  });

  useSevenTvChatRuntime({
    canFetchCosmetics,
    channelId,
    channelName,
    currentEmoteSetIdRef,
    emoteLoadStatus,
    handleNewMessage,
    sevenTvEmoteSetId,
  });

  useTwitchChannelPointsEventSub(channelId);

  const connected =
    twitchConnectionState === ReadyState.OPEN && isChatConnected();

  const {
    appendMentionToComposer,
    prepareTimeoutCommand,
    handleEmotePress,
    handleEmoteSelect,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleReply,
    handleUsernamePress,
  } = useChatInteractionHandlers({
    fetchUserCosmetics,
    inputShellRef,
    chatOverlaysRef,
  });

  const currentUserState = getUserState();
  const parsedBadges = parseBadges(currentUserState['badges-raw']).badges;
  const canModerateChat =
    currentUserState.mod === '1' ||
    parsedBadges.broadcaster === '1' ||
    normaliseChatUsername(user?.login) === normaliseChatUsername(channelName);

  const {
    handlePinMessage,
    handlePinnedMessageChanged,
    handleRefreshPinnedMessage,
    handleUnpinPinnedMessage,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
  } = usePinnedChatMessage({
    canModerateChat,
    channelId,
    moderatorId: user?.id,
  });

  const {
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
  } = useChatSettingsActions({
    channelId,
    channelName,
    forceFlush,
    joinChannel,
    partChannel,
    refetchEmotes,
    reprocessAllMessages,
    scrollToBottom,
  });

  const paneFlags = useMemo(
    () => ({
      canModerateChat,
      connected: twitchConnectionState === ReadyState.OPEN,
      showOnlyMentions,
      showTimestamps: chatTimestamps,
      shouldMaintainScrollAtEnd,
    }),
    [
      canModerateChat,
      chatTimestamps,
      shouldMaintainScrollAtEnd,
      showOnlyMentions,
      twitchConnectionState,
    ],
  );

  const {
    getItemType,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    renderItem,
  } = useChatRowRenderer({
    channelId,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    listRef,
    messages$,
    onEmotePress: handleEmotePress,
    onMessageLongPress: handleMessageLongPress,
    onUsernamePress: handleUsernamePress,
    setHighlightedReplyTargetMessageId,
    user,
  });

  return {
    appendMentionToComposer,
    prepareTimeoutCommand,
    canModerateChat,
    channelId,
    channelName,
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
    hiddenPhrases,
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
    chatOverlaysRef,
    paneFlags,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    processedMessageIdsRef,
    processMessageEmotes,
    renderItem,
    sendAction,
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
