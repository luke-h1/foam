import { memo, useCallback, useEffect, useRef } from 'react';
import { useColorScheme, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@app/context/AuthContext';
import { BenchFrameProbe } from '@app/dev/imageBenchmark/BenchFrameProbe.gate';
import { useSyncPaintRendererFlag } from '@app/hooks/firebase/useSyncPaintRendererFlag';
import { CachedEmotesProvider } from '@app/Providers/CachedEmotesProvider/CachedEmotesProvider';
import { setChatFrontTrimSuspended } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { useCosmeticBindingsVersion } from '@app/store/chat/react/selectors';
import { useChatRenderPreferences } from '@app/store/preferences/selectors';

import { ChatEmoteReprocessor } from './components/ChatEmoteReprocessor';
import type { ChatInputShellHandle } from './components/ChatInputShell';
import { ChatInputShell } from './components/ChatInputShell';
import type { ChatListRef } from './components/ChatList';
import { ChatMessagePane } from './components/ChatMessagePane';
import { ResumeScroll } from './components/ResumeScroll';
import { useChatScroll } from './hooks/useChatScroll';
import { useChatSession } from './hooks/useChatSession';
import { useChatSurface } from './hooks/useChatSurface';
import { useChatTransientState } from './hooks/useChatTransientState';
import { styles as chatSchemeStyles } from './styles';

export interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
  /**
   * DEV/perf only: replace the live Twitch transports (IRC, recent-message
   * replay, EventSub) with nothing, so the synthetic flood is the sole,
   * deterministic message source. Lets the Chat Perf screen replay a repeatable
   * fake of cinna's chat regardless of whether she's live. Channel emote/badge
   * sets still load, so the fake messages render with her real 7TV emotes.
   */
  syntheticTransport?: boolean;
}

export const Chat = memo(
  ({
    applyTopInset = true,
    channelName,
    channelId,
    transparent = false,
    syntheticTransport = false,
  }: ChatProps) => {
    const { user } = useAuthContext();
    const preferences = useChatRenderPreferences();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const styles = chatSchemeStyles[colorScheme === 'light' ? 'light' : 'dark'];
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
      scrollHandlers,
      scrollToBottom,
      maintainBottomAfterContentChange,
      cleanup: cleanupScroll,
    } = useChatScroll({
      listRef,
      getMessagesLength,
    });

    /**
     * While scrolled up (maintainVisibleContentPosition active) pause front-trim
     * of the message window so removing the oldest rows can't re-anchor the list
     * to the top; trimming resumes when the user returns to the bottom.
     */
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
      chatAssetPreferenceKey,
      getItemType,
      handleOpenEmoteSheet,
      handleOpenSettingsSheet,
      handleRefreshCommand,
      handleRefreshPinnedMessage,
      handleResumeScrollToBottom,
      handleUnpinPinnedMessage,
      keyExtractor,
      listContentStyle,
      messageListExtraData,
      overlaysElement,
      paneFlags,
      pinnedMessage,
      pinnedMessageBusy,
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
      user,
    });

    useSyncPaintRendererFlag();
    const cosmeticBindingsVersion = useCosmeticBindingsVersion();
    const emoteReprocessKey = `${chatAssetPreferenceKey}|${cosmeticBindingsVersion}`;

    return (
      <CachedEmotesProvider channelId={channelId}>
        <View
          style={[
            styles.wrapper,
            transparent && styles.wrapperTransparent,
            applyTopInset && { paddingTop: insets.top },
          ]}
        >
          {syntheticTransport ? <BenchFrameProbe /> : null}
          <ChatEmoteReprocessor
            channelId={channelId}
            emoteLoadStatus={emoteLoadStatus}
            messages$={messages$}
            processedMessageIdsRef={processedMessageIdsRef}
            reprocessKey={emoteReprocessKey}
            userLogin={user?.login}
          />
          <View style={styles.keyboardAvoidingView}>
            <View style={styles.chatContainer}>
              <ChatMessagePane
                channelId={channelId}
                channelName={channelName}
                currentUsername={currentUsername}
                hiddenUsers={hiddenUsers}
                hiddenPhrases={hiddenPhrases}
                highlightedUsers={highlightedUsers}
                paneFlags={paneFlags}
                listRef={listRef}
                scrollHandlers={scrollHandlers}
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
              !isScrollingToBottom ? (
                <ResumeScroll
                  unreadCount={unreadCount}
                  onScrollToBottom={handleResumeScrollToBottom}
                />
              ) : null}
            </View>

            <KeyboardStickyView
              offset={{ closed: -insets.bottom }}
              style={styles.inputStickyView}
            >
              <ChatInputShell
                key={user?.id ?? 'signed-out'}
                ref={inputShellRef}
                channelId={channelId}
                channelName={channelName}
                connected={connected}
                getUserState={getUserState}
                isChatConnected={isChatConnected}
                onOpenEmoteSheet={handleOpenEmoteSheet}
                onOpenSettingsSheet={handleOpenSettingsSheet}
                onRefreshCommand={handleRefreshCommand}
                processMessageEmotes={processMessageEmotes}
                sendMessage={sendMessage}
                user={user}
              />
            </KeyboardStickyView>

            {overlaysElement}
          </View>
        </View>
      </CachedEmotesProvider>
    );
  },
);
