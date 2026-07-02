import { memo } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { BenchFrameProbe } from '@app/dev/imageBenchmark/BenchFrameProbe.gate';
import { CachedEmotesProvider } from '@app/Providers/CachedEmotesProvider/CachedEmotesProvider';

import { ChatEmoteReprocessor } from './components/ChatEmoteReprocessor';
import { ChatInputShell } from './components/ChatInputShell';
import { ChatMessagePane } from './components/ChatMessagePane';
import { ResumeScroll } from './components/ResumeScroll';
import { RoomStateChips } from './components/RoomStateChips';
import { useChat } from './hooks/useChat';
import { styles } from './styles';

export interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
  // DEV/perf only: replace the live Twitch transports (IRC, recent-message
  // replay, EventSub) with nothing, so the synthetic flood is the sole,
  // deterministic message source. Lets the Chat Perf screen replay a repeatable
  // fake of cinna's chat regardless of whether she's live. Channel emote/badge
  // sets still load, so the fake messages render with her real 7TV emotes.
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
    const vm = useChat(channelId, channelName, syntheticTransport);

    return (
      <CachedEmotesProvider channelId={channelId}>
        <View
          style={[
            styles.wrapper,
            transparent && styles.wrapperTransparent,
            applyTopInset && { paddingTop: vm.insets.top },
          ]}
        >
          {syntheticTransport ? <BenchFrameProbe /> : null}
          <ChatEmoteReprocessor
            channelId={channelId}
            emoteLoadStatus={vm.emoteLoadStatus}
            messages$={vm.messages$}
            processedMessageIdsRef={vm.processedMessageIdsRef}
            reprocessKey={vm.chatAssetPreferenceKey}
          />
          <View style={styles.keyboardAvoidingView}>
            <View style={styles.chatContainer}>
              <ChatMessagePane
                channelId={channelId}
                channelName={channelName}
                currentUsername={vm.currentUsername}
                hiddenUsers={vm.hiddenUsers}
                hiddenPhrases={vm.hiddenPhrases}
                highlightedUsers={vm.highlightedUsers}
                paneFlags={vm.paneFlags}
                listRef={vm.listRef}
                handleScroll={vm.handleScroll}
                handleScrollBeginDrag={vm.handleScrollBeginDrag}
                handleScrollEndDrag={vm.handleScrollEndDrag}
                handleMomentumScrollBegin={vm.handleMomentumScrollBegin}
                handleMomentumScrollEnd={vm.handleMomentumScrollEnd}
                handleEndReached={vm.handleEndReached}
                handleContentSizeChange={vm.handleContentSizeChange}
                renderItem={vm.renderItem}
                keyExtractor={vm.keyExtractor}
                getItemType={vm.getItemType}
                listContentStyle={vm.listContentStyle}
                messageListExtraData={vm.messageListExtraData}
                onClearFilters={vm.handleClearFilters}
                onRefreshPinnedMessage={vm.handleRefreshPinnedMessage}
                onToggleShowOnlyMentions={vm.handleToggleShowOnlyMentions}
                onUnpinPinnedMessage={vm.handleUnpinPinnedMessage}
                onViewableMessagesChange={vm.handleViewableMessagesChange}
                pinnedMessage={vm.pinnedMessage}
                pinnedMessageBusy={vm.pinnedMessageBusy}
              />

              {vm.preferences.showUnreadJumpPill &&
              !vm.isAtBottom &&
              !vm.isScrollingToBottom ? (
                <ResumeScroll
                  unreadCount={vm.unreadCount}
                  onScrollToBottom={vm.handleResumeScrollToBottom}
                />
              ) : null}
            </View>

            <KeyboardStickyView
              offset={{ closed: -vm.insets.bottom }}
              style={styles.inputStickyView}
            >
              <RoomStateChips channelId={channelId} />
              <ChatInputShell
                ref={vm.inputShellRef}
                channelId={channelId}
                channelName={channelName}
                connected={vm.connected}
                getUserState={vm.getUserState}
                isChatConnected={vm.isChatConnected}
                onOpenEmoteSheet={vm.handleOpenEmoteSheet}
                onOpenSettingsSheet={vm.handleOpenSettingsSheet}
                onRefreshCommand={vm.handleRefreshCommand}
                processMessageEmotes={vm.processMessageEmotes}
                sendMessage={vm.sendMessage}
                user={vm.user}
              />
            </KeyboardStickyView>

            {vm.overlaysElement}
          </View>
        </View>
      </CachedEmotesProvider>
    );
  },
);
