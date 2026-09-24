import { memo, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import {
  KeyboardStickyView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardChatComposerInset } from '@legendapp/list/keyboard';

import { useAuthContext } from '@app/context/AuthContext';
import { BenchFrameProbe } from '@app/dev/imageBenchmark/BenchFrameProbe.gate';
import { useSyncPaintRendererFlag } from '@app/hooks/firebase/useSyncPaintRendererFlag';
import { CachedEmotesProvider } from '@app/Providers/CachedEmotesProvider/CachedEmotesProvider';
import { setChatFrontTrimSuspended } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { useCosmeticBindingsVersion } from '@app/store/chat/react/selectors';
import { useChatRenderPreferences } from '@app/store/preferenceStore';

import { styles } from './Chat.styles';
import { ChatEmoteReprocessor } from './components/ChatEmoteReprocessor';
import type { ChatInputShellHandle } from './components/ChatInputShell';
import { ChatInputShell } from './components/ChatInputShell';
import type { ChatListRef } from './components/ChatList';
import { ChatMessagePane } from './components/ChatMessagePane';
import { ChatOverlayLayer } from './components/ChatOverlayLayer';
import { ResumeScroll } from './components/ResumeScroll';
import { useChatScroll } from './hooks/useChatScroll';
import { useChatSession } from './hooks/useChatSession';
import { useChatSurface } from './hooks/useChatSurface';
import { useChatTransientState } from './hooks/useChatTransientState';

/**
 * First-frame guess at the composer height, before `onComposerLayout` reports
 * the measured value. Only affects the bottom inset on the very first render.
 */
const ESTIMATED_COMPOSER_HEIGHT = 56;

export interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
  // DEV/perf only: drops the live Twitch transports so the synthetic flood is
  // the sole deterministic source; channel emote/badge sets still load so fake messages render real emotes.
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
    const messages$ = chatStore$.messages;
    const currentUsername = user?.login ?? user?.display_name;

    const {
      closeSearch,
      hasActiveFilters,
      handleClearFilters,
      handleSearchQueryChange,
      handleToggleShowOnlyMentions,
      hiddenPhrases,
      hiddenUsers,
      hidePhraseFromView,
      hideUserFromView,
      highlightedReplyTargetTimeoutRef,
      highlightedUsers,
      searchActive,
      searchQuery,
      setHighlightedReplyTargetMessageId,
      showOnlyMentions,
      toggleHighlightedUser,
    } = useChatTransientState(channelId);
    const listRef = useRef<ChatListRef | null>(null);
    const inputShellRef = useRef<ChatInputShellHandle>(null);
    const composerRef = useRef<View>(null);

    // The composer floats over the list bottom, so the list carries its height
    // as a bottom content inset and the keyboard lifts the content itself.
    const { contentInsetEndAdjustment, onComposerLayout } =
      useKeyboardChatComposerInset(
        listRef,
        composerRef,
        insets.bottom + ESTIMATED_COMPOSER_HEIGHT,
      );

    // Ride above the composer, and follow it up when the keyboard lifts it;
    // `keyboard.height` is negative while the keyboard is open.
    const keyboard = useReanimatedKeyboardAnimation();
    const resumeScrollLiftStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY:
            keyboard.height.value -
            contentInsetEndAdjustment.value +
            keyboard.progress.value * insets.bottom,
        },
      ],
    }));

    const getMessagesLength = useCallback(
      () => messages$.peek().length,
      [messages$],
    );

    const {
      isAtBottom,
      isScrollingToBottom,
      shouldMaintainScrollAtEnd,
      scrollAnchor,
      scrollHandlers,
      scrollToBottom,
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
      forceFlush,
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
      listRef,
      preferences,
      scrollAnchor,
      scrollToBottom,
      syntheticTransport,
      user,
    });

    const {
      chatAssetPreferenceKey,
      getItemType,
      handleOpenEmoteSheet,
      handleOpenSettingsSheet,
      handleRefreshEmotesAndBadges,
      handleRefreshPinnedMessage,
      handleResumeScrollToBottom,
      handleUnpinPinnedMessage,
      keyExtractor,
      messageListExtraData,
      overlayProps,
      paneFlags,
      pinnedMessage,
      pinnedMessageBusy,
      renderItem,
    } = useChatSurface({
      channelId,
      channelName,
      forceFlush,
      hiddenUsers,
      hidePhraseFromView,
      hideUserFromView,
      highlightedReplyTargetTimeoutRef,
      highlightedUsers,
      inputShellRef,
      joinChannel,
      listRef,
      noteScrollAwayIntent: scrollAnchor.noteScrollAwayIntent,
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
                contentInsetEndAdjustment={contentInsetEndAdjustment}
                currentUsername={currentUsername}
                hiddenUsers={hiddenUsers}
                hiddenPhrases={hiddenPhrases}
                paneFlags={paneFlags}
                listRef={listRef}
                scrollHandlers={scrollHandlers}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemType={getItemType}
                messageListExtraData={messageListExtraData}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                onCloseSearch={closeSearch}
                onSearchQueryChange={handleSearchQueryChange}
                onRefreshPinnedMessage={handleRefreshPinnedMessage}
                onToggleShowOnlyMentions={handleToggleShowOnlyMentions}
                onUnpinPinnedMessage={handleUnpinPinnedMessage}
                onViewableMessagesChange={handleViewableMessagesChange}
                pinnedMessage={pinnedMessage}
                pinnedMessageBusy={pinnedMessageBusy}
                searchActive={searchActive}
                searchQuery={searchQuery}
              />

              {preferences.showUnreadJumpPill &&
              !isAtBottom &&
              !isScrollingToBottom ? (
                <Animated.View
                  pointerEvents='box-none'
                  style={[styles.resumeScrollLift, resumeScrollLiftStyle]}
                >
                  <ResumeScroll onScrollToBottom={handleResumeScrollToBottom} />
                </Animated.View>
              ) : null}
            </View>

            <KeyboardStickyView
              offset={{ closed: 0, opened: insets.bottom }}
              style={styles.inputStickyView}
            >
              <View
                collapsable={false}
                onLayout={onComposerLayout}
                ref={composerRef}
              >
                <ChatInputShell
                  key={user?.id ?? 'signed-out'}
                  ref={inputShellRef}
                  channelId={channelId}
                  channelName={channelName}
                  connected={connected}
                  isChatConnected={isChatConnected}
                  onOpenEmoteSheet={handleOpenEmoteSheet}
                  onOpenSettingsSheet={handleOpenSettingsSheet}
                  onRefreshCommand={handleRefreshEmotesAndBadges}
                  processMessageEmotes={processMessageEmotes}
                  sendMessage={sendMessage}
                  user={user}
                />
              </View>
            </KeyboardStickyView>

            <ChatOverlayLayer {...overlayProps} />
          </View>
        </View>
      </CachedEmotesProvider>
    );
  },
);
