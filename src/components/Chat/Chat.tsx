import { memo } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { ChatEmoteReprocessor } from './components/ChatEmoteReprocessor';
import { ChatInputShell } from './components/ChatInputShell';
import { ChatMessagePane } from './components/ChatMessagePane';
import { ResumeScroll } from './components/ResumeScroll';
import { useChat } from './hooks/useChat';
import { styles } from './styles';

export interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
}

export const Chat = memo(
  ({
    applyTopInset = true,
    channelName,
    channelId,
    transparent = false,
  }: ChatProps) => {
    const vm = useChat(channelId, channelName);

    return (
      <View
        style={[
          styles.wrapper,
          transparent && styles.wrapperTransparent,
          applyTopInset && { paddingTop: vm.insets.top },
        ]}
      >
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
            <ChatInputShell
              ref={vm.inputShellRef}
              canPinNextMessage={vm.canModerateChat}
              channelId={channelId}
              channelName={channelName}
              connected={vm.connected}
              getUserState={vm.getUserState}
              isChatConnected={vm.isChatConnected}
              onOpenEmoteSheet={vm.handleOpenEmoteSheet}
              onOpenSettingsSheet={vm.handleOpenSettingsSheet}
              onPinnedMessageChanged={vm.handlePinnedMessageChanged}
              processMessageEmotes={vm.processMessageEmotes}
              sendMessage={vm.sendMessage}
              user={vm.user}
            />
          </KeyboardStickyView>

          {vm.overlaysElement}
        </View>
      </View>
    );
  },
);
