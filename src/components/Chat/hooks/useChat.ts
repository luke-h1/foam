import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useSyntheticChatFlood } from '@app/dev/imageBenchmark/useSyntheticChatFlood.gate';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useTwitchChannelPointsEventSub } from '@app/hooks/useTwitchChannelPointsEventSub';
import { ReadyState } from '@app/hooks/ws/constants';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { setChatFrontTrimSuspended } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  useChatRenderPreferences,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { findCustomHighlight } from '@app/utils/chat/customHighlights';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type { ChatListRef } from '../components/ChatList';
import { useChatOverlays } from '../components/useChatOverlays';
import { normaliseChatUsername } from '../util/chatUsernames';
import { triggerMentionHaptic } from '../util/mentionHaptics';
import { useChatCosmetics } from './useChatCosmetics';
import { useChatEmoteLoader } from './useChatEmoteLoader';
import {
  useChatComposerActions,
  useChatOverlayActions,
} from './useChatInteractionHandlers';
import { useChatIrcHandlers } from './useChatIrcHandlers';
import { useChatLifecycle } from './useChatLifecycle';
import { useChatMessageProcessing } from './useChatMessageProcessing';
import { useChatMessages } from './useChatMessages';
import { useChatRowRenderer } from './useChatRowRenderer';
import { useChatScroll } from './useChatScroll';
import { useChatSettingsActions } from './useChatSettingsActions';
import { useChatTransientState } from './useChatTransientState';
import { usePinnedChatMessage } from './usePinnedChatMessage';
import { useRecentChatMessages } from './useRecentChatMessages';
import { useSevenTvChatRuntime } from './useSevenTvChatRuntime';

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
  const showRecentMessages = preferences.showRecentMessages !== false;
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
  const chatAssetPreferenceKey = useMemo(
    () =>
      [
        preferences.emojiStyle,
        preferences.show7TvEmotes,
        preferences.showBttvEmotes,
        preferences.showFFzEmotes,
        preferences.showTwitchEmotes,
        preferences.show7tvBadges,
        preferences.showBttvBadges,
        preferences.showFFzBadges,
        preferences.showTwitchBadges,
        preferences.showChatterinoEmotes,
      ].join('|'),
    [
      preferences.emojiStyle,
      preferences.show7TvEmotes,
      preferences.showBttvEmotes,
      preferences.showFFzEmotes,
      preferences.showTwitchEmotes,
      preferences.show7tvBadges,
      preferences.showBttvBadges,
      preferences.showFFzBadges,
      preferences.showTwitchBadges,
      preferences.showChatterinoEmotes,
    ],
  );

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
    handleNewMessage: enqueueChatMessage,
    clearLocalMessages,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
    cleanup: cleanupMessages,
    forceFlush,
  } = useChatMessages({
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange: maintainBottomAfterContentChange,
    onUnreadIncrement: useCallback(
      (count: number) => setUnreadCount(prev => prev + count),
      [setUnreadCount],
    ),
  });

  const chatMentionHaptics = usePreference('chatMentionHaptics');
  const customHighlights = preferences.customHighlights;
  const normalisedSelfForFeedback = normaliseChatUsername(
    user?.login ?? user?.display_name,
  );

  // Live messages only (recent-message replays pass countUnread: false), so
  // re-entering a chat never replays a burst of buzzes.
  const handleNewMessage: typeof enqueueChatMessage = useCallback(
    (message, options) => {
      const customHighlightRules = customHighlights ?? [];
      if (chatMentionHaptics && options?.countUnread !== false) {
        const mentionsSelf =
          normalisedSelfForFeedback.length > 0 &&
          message.message.some(
            part =>
              part.type === 'mention' &&
              normaliseChatUsername(part.content.replace(/^@/, '')) ===
                normalisedSelfForFeedback,
          );
        const matchesCustomHighlight =
          !mentionsSelf &&
          customHighlightRules.length > 0 &&
          Boolean(findCustomHighlight(message.message, customHighlightRules));

        if (mentionsSelf || matchesCustomHighlight) {
          triggerMentionHaptic();
        }
      }

      enqueueChatMessage(message, options);
    },
    [
      chatMentionHaptics,
      customHighlights,
      enqueueChatMessage,
      normalisedSelfForFeedback,
    ],
  );

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
    show7TvEmotes: preferences.show7TvEmotes,
    show7tvBadges: preferences.show7tvBadges,
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
    removeBufferedMessagesByLogin,
  });

  const {
    connectionState: twitchConnectionState,
    isConnected: isChatConnected,
    partChannel,
    joinChannel,
    sendMessage,
    sendChatCommand,
    getUserState,
  } = useTwitchChat({
    // No channel ⇒ the IRC socket never connects (shouldConnect is false), so
    // in perf mode the synthetic flood is the only thing feeding onMessage.
    channel: syntheticTransport ? undefined : channelName,
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

  useSyntheticChatFlood({
    channelName,
    channelId,
    onMessage,
    enabled: syntheticTransport,
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
    // No real recent-message replay in perf mode — the flood seeds the scrollback.
    showRecentMessages: syntheticTransport ? false : showRecentMessages,
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

  // undefined channelId ⇒ EventSub never subscribes (canSubscribe is false).
  useTwitchChannelPointsEventSub(syntheticTransport ? undefined : channelId);

  const connected =
    twitchConnectionState === ReadyState.OPEN && isChatConnected();

  const {
    appendMentionToComposer,
    handleEmoteSelect,
    handleReply,
    insertPhraseToComposer,
  } = useChatComposerActions({
    fetchUserCosmetics,
    inputShellRef,
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
    handleRefreshCommand,
    handleToggleChatDensity,
    handleToggleHighlightOwnMentions,
    handleToggleInlineReplyContext,
    handleToggleShowTimestamps,
    handleToggleShowUnreadJumpPill,
  } = useChatSettingsActions({
    channelId,
    channelName,
    chatDensity: preferences.chatDensity,
    forceFlush,
    joinChannel,
    partChannel,
    refetchEmotes,
    reprocessAllMessages,
    scrollToBottom,
    updatePreferences,
  });

  const { openers, overlaysElement } = useChatOverlays({
    appendMentionToComposer,
    canModerateChat,
    channelId,
    channelName,
    currentUserId: user?.id,
    disableEmoteAnimations: preferences.disableEmoteAnimations,
    handleReply,
    hiddenUsers,
    highlightedUsers,
    hidePhraseFromView,
    hideUserFromView,
    insertPhraseToComposer,
    onClearChatCache: handleClearChatCache,
    onClearImageCache: handleDebugClearImageCache,
    onClearSevenTvCosmeticsCache: handleClearSevenTvCosmeticsCache,
    onInsertEmote: handleEmoteSelect,
    onPinMessage: handlePinMessage,
    onRefreshPinnedMessage: handleRefreshPinnedMessage,
    onSettingsReconnect: handleSettingsReconnect,
    onSettingsRefetchEmotes: handleSettingsRefetchEmotes,
    onToggleChatDensity: handleToggleChatDensity,
    onToggleHighlightOwnMentions: handleToggleHighlightOwnMentions,
    onToggleInlineReplyContext: handleToggleInlineReplyContext,
    onToggleShowTimestamps: handleToggleShowTimestamps,
    onToggleShowUnreadJumpPill: handleToggleShowUnreadJumpPill,
    onUnpinPinnedMessage: handleUnpinPinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    sendChatCommand,
    showInlineReplyContext: preferences.showInlineReplyContext,
    showTimestamps: preferences.chatTimestamps,
    showUnreadJumpPill: preferences.showUnreadJumpPill,
    chatDensity: preferences.chatDensity,
    highlightOwnMentions: preferences.highlightOwnMentions,
    toggleHighlightedUser,
  });

  const {
    handleBadgeLongPress,
    handleEmotePress,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleUsernamePress,
  } = useChatOverlayActions(openers);

  const paneFlags = useMemo(
    () => ({
      canModerateChat,
      connected: twitchConnectionState === ReadyState.OPEN,
      showOnlyMentions,
      showTimestamps: preferences.chatTimestamps,
      shouldMaintainScrollAtEnd,
    }),
    [
      canModerateChat,
      preferences.chatTimestamps,
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
    onBadgePress: handleBadgeLongPress,
    onEmotePress: handleEmotePress,
    onMessageLongPress: handleMessageLongPress,
    onUsernamePress: handleUsernamePress,
    preferences,
    setHighlightedReplyTargetMessageId,
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
