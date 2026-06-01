import { useAuthContext } from '@app/context/AuthContext';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { chatStore$ } from '@app/store/chatStore/state';
import {
  useChatRenderPreferences,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { useNavigation } from 'expo-router';
import { memo, useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReadyState } from '@app/hooks/ws/constants';

import { ChatEmoteRuntime } from './components/ChatEmoteRuntime';
import {
  ChatInputShell,
  type ChatInputShellHandle,
} from './components/ChatInputShell';
import { ChatMessagePane } from './components/ChatMessagePane';
import type { ChatListRef } from './components/ChatList';
import {
  ChatOverlayController,
  type ChatOverlayControllerHandle,
} from './components/ChatOverlayController';
import { ResumeScroll } from './components/ResumeScroll';
import { useChatEmoteLoader } from './hooks/useChatEmoteLoader';
import { useChatCosmetics } from './hooks/useChatCosmetics';
import { useChatLifecycle } from './hooks/useChatLifecycle';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
import { useChatInteractionHandlers } from './hooks/useChatInteractionHandlers';
import { useChatIrcHandlers } from './hooks/useChatIrcHandlers';
import { useChatMessageProcessing } from './hooks/useChatMessageProcessing';
import { useChatRowRenderer } from './hooks/useChatRowRenderer';
import { useChatSettingsActions } from './hooks/useChatSettingsActions';
import { useChatTransientState } from './hooks/useChatTransientState';
import { usePinnedChatMessage } from './hooks/usePinnedChatMessage';
import { useRecentChatMessages } from './hooks/useRecentChatMessages';
import { useSevenTvChatRuntime } from './hooks/useSevenTvChatRuntime';
import { normaliseChatUsername } from './util/chatUsernames';
import { styles } from './styles';

export interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
}

export const ChatView = memo(
  ({
    applyTopInset = true,
    channelName,
    channelId,
    transparent = false,
  }: ChatProps) => {
    const { user } = useAuthContext();
    const preferences = useChatRenderPreferences();
    const updatePreferences = useUpdatePreferences();
    const showRecentMessages = preferences.showRecentMessages !== false;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const messages$ = chatStore$.messages;
    const currentUsername = user?.login ?? user?.display_name;

    const processedMessageIdsRef = useRef<Set<string>>(new Set());
    const {
      handleClearFilters,
      handleToggleShowOnlyMentions,
      hiddenPhrases,
      hiddenUsers,
      hidePhraseFromView,
      hideUserFromView,
      highlightedReplyTargetMessageId,
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
    const overlayControllerRef = useRef<ChatOverlayControllerHandle>(null);

    const { canFetchCosmetics, fetchedCosmeticsUsersRef, fetchUserCosmetics } =
      useChatCosmetics({
        channelId,
        user,
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
      disableEmoteAnimations: preferences.disableEmoteAnimations,
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
      processedMessageIdsRef,
    });

    useRecentChatMessages({
      channelId,
      channelName,
      forceFlush,
      handleRecentIrcMessage,
      scrollToBottom,
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

    const connected =
      twitchConnectionState === ReadyState.OPEN && isChatConnected();

    const {
      appendMentionToComposer,
      handleBadgeLongPress,
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
      overlayControllerRef,
    });

    const canModerateChat = useMemo(() => {
      const currentUserState = getUserState();
      const parsedBadges = parseBadges(currentUserState['badges-raw']).badges;
      return (
        currentUserState.mod === '1' ||
        parsedBadges.broadcaster === '1' ||
        normaliseChatUsername(user?.login) ===
          normaliseChatUsername(channelName)
      );
    }, [channelName, getUserState, user?.login]);

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
      chatDensity: preferences.chatDensity,
      forceFlush,
      joinChannel,
      partChannel,
      refetchEmotes,
      reprocessAllMessages,
      scrollToBottom,
      updatePreferences,
    });

    const {
      getItemType,
      keyExtractor,
      listContentStyle,
      messageListExtraData,
      renderItem,
    } = useChatRowRenderer({
      channelId,
      highlightedReplyTargetMessageId,
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

    return (
      <View
        style={[
          styles.wrapper,
          transparent && styles.wrapperTransparent,
          applyTopInset && { paddingTop: insets.top },
        ]}
      >
        <ChatEmoteRuntime
          channelId={channelId}
          emoteLoadStatus={emoteLoadStatus}
          messages$={messages$}
          processedMessageIdsRef={processedMessageIdsRef}
          reprocessKey={chatAssetPreferenceKey}
        />
        <View style={styles.keyboardAvoidingView}>
          <View style={styles.chatContainer}>
            <ChatMessagePane
              canModerateChat={canModerateChat}
              channelId={channelId}
              channelName={channelName}
              connected={twitchConnectionState === ReadyState.OPEN}
              currentUsername={currentUsername}
              hiddenUsers={hiddenUsers}
              hiddenPhrases={hiddenPhrases}
              highlightedUsers={highlightedUsers}
              showOnlyMentions={showOnlyMentions}
              chatDensity={preferences.chatDensity}
              showTimestamps={preferences.chatTimestamps}
              listRef={listRef}
              shouldMaintainScrollAtEnd={shouldMaintainScrollAtEnd}
              handleScroll={handleScroll}
              handleScrollBeginDrag={handleScrollBeginDrag}
              handleScrollEndDrag={handleScrollEndDrag}
              handleMomentumScrollEnd={handleMomentumScrollEnd}
              handleEndReached={handleEndReached}
              handleContentSizeChange={handleContentSizeChange}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              listContentStyle={listContentStyle}
              messageListExtraData={messageListExtraData}
              onClearFilters={handleClearFilters}
              onRefreshPinnedMessage={handleRefreshPinnedMessage}
              onToggleShowOnlyMentions={handleToggleShowOnlyMentions}
              onUnpinPinnedMessage={handleUnpinPinnedMessage}
              onViewableMessagesChange={handleViewableMessagesChange}
              pinnedMessage={pinnedMessage}
              pinnedMessageBusy={pinnedMessageBusy}
            />

            {preferences.showUnreadJumpPill &&
              !isAtBottom &&
              !isScrollingToBottom && (
                <ResumeScroll
                  unreadCount={unreadCount}
                  onScrollToBottom={handleResumeScrollToBottom}
                />
              )}
          </View>

          <KeyboardStickyView style={styles.inputStickyView}>
            <ChatInputShell
              ref={inputShellRef}
              canPinNextMessage={canModerateChat}
              channelId={channelId}
              channelName={channelName}
              connected={connected}
              getUserState={getUserState}
              isChatConnected={isChatConnected}
              onOpenEmoteSheet={handleOpenEmoteSheet}
              onOpenSettingsSheet={handleOpenSettingsSheet}
              onPinnedMessageChanged={handlePinnedMessageChanged}
              processMessageEmotes={processMessageEmotes}
              sendMessage={sendMessage}
              user={user}
            />
          </KeyboardStickyView>

          <ChatOverlayController
            ref={overlayControllerRef}
            canModerateChat={canModerateChat}
            channelId={channelId}
            channelName={channelName}
            connected={connected}
            disableEmoteAnimations={preferences.disableEmoteAnimations}
            handleReply={handleReply}
            highlightedUsers={highlightedUsers}
            hiddenUsers={hiddenUsers}
            hidePhraseFromView={hidePhraseFromView}
            hideUserFromView={hideUserFromView}
            appendMentionToComposer={appendMentionToComposer}
            onClearChatCache={handleClearChatCache}
            onClearImageCache={handleDebugClearImageCache}
            onClearSevenTvCosmeticsCache={handleClearSevenTvCosmeticsCache}
            onInsertEmote={handleEmoteSelect}
            onPinMessage={handlePinMessage}
            onRefreshPinnedMessage={handleRefreshPinnedMessage}
            onSettingsReconnect={handleSettingsReconnect}
            onSettingsRefetchEmotes={handleSettingsRefetchEmotes}
            onToggleChatDensity={handleToggleChatDensity}
            onToggleHighlightOwnMentions={handleToggleHighlightOwnMentions}
            onToggleInlineReplyContext={handleToggleInlineReplyContext}
            onToggleShowTimestamps={handleToggleShowTimestamps}
            onToggleShowUnreadJumpPill={handleToggleShowUnreadJumpPill}
            onUnpinPinnedMessage={handleUnpinPinnedMessage}
            pinnedMessageBusy={pinnedMessageBusy}
            pinnedMessageId={pinnedMessageId}
            sendChatCommand={sendChatCommand}
            chatDensity={preferences.chatDensity}
            highlightOwnMentions={preferences.highlightOwnMentions}
            showInlineReplyContext={preferences.showInlineReplyContext}
            showTimestamps={preferences.chatTimestamps}
            showUnreadJumpPill={preferences.showUnreadJumpPill}
            toggleHighlightedUser={toggleHighlightedUser}
          />
        </View>
      </View>
    );
  },
);

ChatView.displayName = 'ChatView';
