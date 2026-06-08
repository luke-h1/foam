import { useChannelEmoteData } from '@app/store/chat/react/selectors';
import {
  useChatAssetPreferenceKey,
  useChatViewPreferences,
} from '@app/store/preferences';
import { memo } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { ChatInputShell } from './ChatInputShell';
import { ChatMessagePane } from './ChatMessagePane';
import { ChatOverlays } from './ChatOverlays';
import { ResumeScroll } from './ResumeScroll';
import { useChat } from './hooks/useChat';
import { useEmoteReprocessing } from './hooks/useEmoteReprocessing';
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
    const preferences = useChatViewPreferences();
    const channelEmoteData = useChannelEmoteData(channelId);
    const chatAssetPreferenceKey = useChatAssetPreferenceKey();

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$: vm.messages$,
      emoteLoadStatus: vm.emoteLoadStatus,
      processedMessageIdsRef: vm.processedMessageIdsRef,
      reprocessKey: chatAssetPreferenceKey,
    });

    return (
      <View
        style={[
          styles.wrapper,
          transparent && styles.wrapperTransparent,
          applyTopInset && { paddingTop: vm.insets.top },
        ]}
      >
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
              chatDensity={preferences.chatDensity}
              listRef={vm.listRef}
              handleScroll={vm.handleScroll}
              handleScrollBeginDrag={vm.handleScrollBeginDrag}
              handleScrollEndDrag={vm.handleScrollEndDrag}
              handleMomentumScrollEnd={vm.handleMomentumScrollEnd}
              handleEndReached={vm.handleEndReached}
              handleContentSizeChange={vm.handleContentSizeChange}
              renderItem={vm.renderItem}
              keyExtractor={vm.keyExtractor}
              getItemType={vm.getItemType}
              listContentStyle={vm.listContentStyle}
              messageListExtraData={vm.messageListExtraData}
              showInlineReplyContext={preferences.showInlineReplyContext}
              onClearFilters={vm.handleClearFilters}
              onRefreshPinnedMessage={vm.handleRefreshPinnedMessage}
              onToggleShowOnlyMentions={vm.handleToggleShowOnlyMentions}
              onUnpinPinnedMessage={vm.handleUnpinPinnedMessage}
              onViewableMessagesChange={vm.handleViewableMessagesChange}
              pinnedMessage={vm.pinnedMessage}
              pinnedMessageBusy={vm.pinnedMessageBusy}
            />

            {preferences.showUnreadJumpPill &&
            !vm.isAtBottom &&
            !vm.isScrollingToBottom ? (
              <ResumeScroll
                unreadCount={vm.unreadCount}
                onScrollToBottom={vm.handleResumeScrollToBottom}
              />
            ) : null}
          </View>

          <KeyboardStickyView style={styles.inputStickyView}>
            <ChatInputShell
              ref={vm.inputShellRef}
              canModerateChat={vm.canModerateChat}
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
              sendAction={vm.sendAction}
              sendChatCommand={vm.sendChatCommand}
              sendMessage={vm.sendMessage}
              user={vm.user}
            />
          </KeyboardStickyView>

          <ChatOverlays
            ref={vm.chatOverlaysRef}
            canModerateChat={vm.canModerateChat}
            channelId={channelId}
            channelName={channelName}
            disableEmoteAnimations={preferences.disableEmoteAnimations}
            highlightOwnMentions={preferences.highlightOwnMentions}
            showInlineReplyContext={preferences.showInlineReplyContext}
            showTimestamps={preferences.chatTimestamps}
            showUnreadJumpPill={preferences.showUnreadJumpPill}
            chatDensity={preferences.chatDensity}
            handleReply={vm.handleReply}
            highlightedUsers={vm.highlightedUsers}
            hiddenUsers={vm.hiddenUsers}
            hidePhraseFromView={vm.hidePhraseFromView}
            hideUserFromView={vm.hideUserFromView}
            appendMentionToComposer={vm.appendMentionToComposer}
            prepareTimeoutCommand={vm.prepareTimeoutCommand}
            onClearChatCache={vm.handleClearChatCache}
            onClearImageCache={vm.handleDebugClearImageCache}
            onClearSevenTvCosmeticsCache={vm.handleClearSevenTvCosmeticsCache}
            onInsertEmote={vm.handleEmoteSelect}
            onPinMessage={vm.handlePinMessage}
            onRefreshPinnedMessage={vm.handleRefreshPinnedMessage}
            onSettingsReconnect={vm.handleSettingsReconnect}
            onSettingsRefetchEmotes={vm.handleSettingsRefetchEmotes}
            onToggleChatDensity={vm.handleToggleChatDensity}
            onToggleHighlightOwnMentions={vm.handleToggleHighlightOwnMentions}
            onToggleInlineReplyContext={vm.handleToggleInlineReplyContext}
            onToggleShowTimestamps={vm.handleToggleShowTimestamps}
            onToggleShowUnreadJumpPill={vm.handleToggleShowUnreadJumpPill}
            onUnpinPinnedMessage={vm.handleUnpinPinnedMessage}
            pinnedMessageBusy={vm.pinnedMessageBusy}
            pinnedMessageId={vm.pinnedMessageId}
            sendChatCommand={vm.sendChatCommand}
            toggleHighlightedUser={vm.toggleHighlightedUser}
          />
        </View>
      </View>
    );
  },
);
