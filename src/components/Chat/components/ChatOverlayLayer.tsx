import { memo } from 'react';

import {
  resolveModTarget,
  useChatOverlayHandlers,
} from '@app/components/Chat/hooks/useChatOverlayHandlers';
import { openChatUserActions } from '@app/store/chat/actions/chatOverlays';
import { useChatOverlayState } from '@app/store/chat/react/overlaySelectors';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { usePreference } from '@app/store/preferenceStore';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

import { ActionSheet } from './ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './BadgePreviewSheet/BadgePreviewSheet';
import { ChatDebugLogRecorder } from './ChatDebugLogRecorder';
import type { MessageActionData } from './ChatMessage/RichChatMessage.types';
import { ChattersSheet } from './ChattersSheet/ChattersSheet';
import { EmotePreviewSheet } from './EmotePreviewSheet/EmotePreviewSheet';
import { EmoteSheet } from './EmoteSheet/EmoteSheet';
import type { EmotePickerItem } from './EmoteSheet/emoteSheetTypes';
import { SavedPhrasesSheet } from './SavedPhrasesSheet/SavedPhrasesSheet';
import { SettingsSheet } from './SettingsSheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';

export interface ChatOverlayLayerProps {
  canModerateChat: boolean;
  channelId: string;
  channelName: string;
  currentUserId?: string;
  hiddenUsers: string[];
  highlightedUsers: string[];
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  onAppendMention: (username: string) => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onClearSevenTvCosmeticsCache: () => void;
  onInsertEmote: (item: EmotePickerItem) => void;
  onInsertPhrase: (text: string) => void;
  onPinMessage: (message: MessageActionData<'usernotice'>) => void;
  onRefreshPinnedMessage: (messageId: string) => void;
  onReply: (message: ChatMessageType<'usernotice'>) => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onUnpinPinnedMessage: () => void;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  toggleHighlightedUser: (username?: string) => void;
}

/**
 * Every chat sheet, and the actions they fire. It subscribes to the overlay
 * observable itself rather than taking the open sheet as a prop, so opening or
 * dismissing a sheet re-renders this subtree and nothing above it.
 */
export const ChatOverlayLayer = memo(function ChatOverlayLayer({
  canModerateChat,
  channelId,
  channelName,
  currentUserId,
  hiddenUsers,
  highlightedUsers,
  hidePhraseFromView,
  hideUserFromView,
  onAppendMention,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onInsertEmote,
  onInsertPhrase,
  onPinMessage,
  onRefreshPinnedMessage,
  onReply,
  onSettingsReconnect,
  onSettingsRefetchEmotes,
  onUnpinPinnedMessage,
  pinnedMessageBusy,
  pinnedMessageId,
  toggleHighlightedUser,
}: ChatOverlayLayerProps) {
  const {
    isChattersSheetMounted,
    isEmoteSheetMounted,
    isSavedPhrasesSheetMounted,
    isSettingsSheetMounted,
    selectedBadge,
    selectedEmote,
    selectedMessage,
    selectedUser,
  } = useChatOverlayState(channelId);

  const chatDebugTools = usePreference('chatDebugTools');

  const {
    handleActionSheetBanUser,
    handleActionSheetCopy,
    handleActionSheetDeleteMessage,
    handleActionSheetHidePhrase,
    handleActionSheetHideUser,
    handleActionSheetHighlightUser,
    handleActionSheetPinMessage,
    handleActionSheetReply,
    handleActionSheetTimeoutUser,
    handleActionSheetUpdatePinnedMessage,
    handleBanSelectedUser,
    handleBlockSelectedUser,
    handleChattersSheetDidDismiss,
    handleCloseSelectedBadge,
    handleCloseSelectedEmote,
    handleCloseSelectedMessage,
    handleCloseSelectedUser,
    handleCopySelectedUsername,
    handleEmoteSheetDidDismiss,
    handleHideSelectedUser,
    handleHighlightSelectedUser,
    handleMentionSelectedUser,
    handleOpenChatters,
    handleOpenMessageSearch,
    handleOpenSavedPhrases,
    handleReportSelectedUser,
    handleSavedPhrasesSheetDidDismiss,
    handleSettingsSheetDidDismiss,
    handleTimeoutSelectedUser,
    handleWarnSelectedUser,
  } = useChatOverlayHandlers({
    channelId,
    currentUserId,
    hidePhraseFromView,
    hideUserFromView,
    onAppendMention,
    onPinMessage,
    onRefreshPinnedMessage,
    onReply,
    selectedMessage,
    selectedUser,
    toggleHighlightedUser,
  });

  const selectedUserId = selectedUser?.userId?.trim();
  const canBlockSelectedUser = Boolean(
    selectedUserId &&
    /^\d+$/.test(selectedUserId) &&
    selectedUserId !== currentUserId,
  );
  const selectedMessageId = selectedMessage?.messageData.message_id?.trim();

  return (
    <>
      {isDevToolsEnabled && chatDebugTools ? (
        <ChatDebugLogRecorder channelId={channelId} channelName={channelName} />
      ) : null}

      {isEmoteSheetMounted ? (
        <EmoteSheet
          isPresented
          onDismiss={handleEmoteSheetDidDismiss}
          onEmoteSelect={onInsertEmote}
        />
      ) : null}

      {isSettingsSheetMounted ? (
        <SettingsSheet
          isPresented
          onClearChatCache={onClearChatCache}
          onClearImageCache={onClearImageCache}
          onClearSevenTvCosmeticsCache={onClearSevenTvCosmeticsCache}
          onDismiss={handleSettingsSheetDidDismiss}
          onOpenChatters={handleOpenChatters}
          onOpenMessageSearch={handleOpenMessageSearch}
          onOpenSavedPhrases={handleOpenSavedPhrases}
          onRefetchEmotes={onSettingsRefetchEmotes}
          onReconnect={onSettingsReconnect}
        />
      ) : null}

      {isChattersSheetMounted ? (
        <ChattersSheet
          isPresented
          onDismiss={handleChattersSheetDidDismiss}
          onSelectChatter={chatter => openChatUserActions(channelId, chatter)}
        />
      ) : null}

      {isSavedPhrasesSheetMounted ? (
        <SavedPhrasesSheet
          isPresented
          onDismiss={handleSavedPhrasesSheetDidDismiss}
          onSelectPhrase={onInsertPhrase}
        />
      ) : null}

      {selectedBadge ? (
        <BadgePreviewSheet
          visible
          onClose={handleCloseSelectedBadge}
          selectedBadge={selectedBadge}
        />
      ) : null}

      {selectedEmote ? (
        <EmotePreviewSheet
          visible
          onClose={handleCloseSelectedEmote}
          selectedEmote={selectedEmote}
        />
      ) : null}

      {selectedMessage ? (
        <ActionSheet
          visible
          onClose={handleCloseSelectedMessage}
          username={selectedMessage.username}
          messagePreview={selectedMessage.message}
          onReply={handleActionSheetReply}
          onCopy={handleActionSheetCopy}
          onHidePhrase={handleActionSheetHidePhrase}
          onHideUser={handleActionSheetHideUser}
          onHighlightUser={handleActionSheetHighlightUser}
          onPinMessage={handleActionSheetPinMessage}
          onUpdatePinnedMessage={handleActionSheetUpdatePinnedMessage}
          onUnpinMessage={onUnpinPinnedMessage}
          onDeleteMessage={handleActionSheetDeleteMessage}
          onTimeoutUser={handleActionSheetTimeoutUser}
          onBanUser={handleActionSheetBanUser}
          canModerateChat={canModerateChat}
          canDeleteMessage={Boolean(selectedMessageId)}
          canPinMessage={Boolean(!pinnedMessageBusy && selectedMessageId)}
          canModerateUser={Boolean(resolveModTarget(selectedMessage))}
          isPinnedMessage={
            pinnedMessageId === selectedMessage.messageData.message_id
          }
          isPinnedMessageBusy={pinnedMessageBusy}
          isUserHighlighted={highlightedUsers.includes(
            normaliseChatUsername(selectedMessage.username),
          )}
        />
      ) : null}

      {selectedUser ? (
        <UserActionSheet
          visibility={{
            visible: true,
            isHidden: hiddenUsers.includes(
              normaliseChatUsername(selectedUser.username),
            ),
            isHighlighted: highlightedUsers.includes(
              normaliseChatUsername(selectedUser.username),
            ),
          }}
          moderation={{
            canModerateChat,
            canModerateUser: Boolean(resolveModTarget(selectedUser)),
          }}
          onClose={handleCloseSelectedUser}
          username={selectedUser.username}
          login={selectedUser.login}
          userId={selectedUser.userId}
          color={selectedUser.color}
          onMentionUser={handleMentionSelectedUser}
          onCopyUsername={handleCopySelectedUsername}
          onHideUser={handleHideSelectedUser}
          onHighlightUser={handleHighlightSelectedUser}
          onBlockUser={
            canBlockSelectedUser ? handleBlockSelectedUser : undefined
          }
          onReportUser={handleReportSelectedUser}
          onTimeoutUser={handleTimeoutSelectedUser}
          onWarnUser={handleWarnSelectedUser}
          onBanUser={handleBanSelectedUser}
        />
      ) : null}
    </>
  );
});
