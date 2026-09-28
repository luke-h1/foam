import { memo } from 'react';

import {
  resolveModTarget,
  useChatOverlayHandlers,
} from '@app/components/chat/hooks/use-chat-overlay-handlers';
import { openChatUserActions } from '@app/store/chat/actions/chat-overlays';
import { useChatOverlayState } from '@app/store/chat/react/overlay-selectors';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { usePreference } from '@app/store/preference-store';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { isDevToolsEnabled } from '@app/utils/dev-tools/is-dev-tools-enabled';

import { ActionSheet } from './action-sheet/action-sheet';
import { BadgePreviewSheet } from './badge-preview-sheet/badge-preview-sheet';
import { ChatDebugLogRecorder } from './chat-debug-log-recorder';
import type { MessageActionData } from './chat-message/chat-row.types';
import { ChattersSheet } from './chatters-sheet/chatters-sheet';
import { EmotePreviewSheet } from './emote-preview-sheet/emote-preview-sheet';
import { EmoteSheet } from './emote-sheet/emote-sheet';
import type { EmotePickerItem } from './emote-sheet/util/emote-sheet-types';
import { SavedPhrasesSheet } from './saved-phrases-sheet/saved-phrases-sheet';
import { SettingsSheet } from './settings-sheet/settings-sheet';
import { UserActionSheet } from './user-action-sheet';

/**
 * Twitch only blocks by numeric user id, and a user cannot block themselves.
 */
function canBlockUserId(userId: string | undefined, currentUserId?: string) {
  const target = userId?.trim();
  return Boolean(target && /^\d+$/.test(target) && target !== currentUserId);
}

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
 * Subscribes to the overlay observable itself, so opening or dismissing a
 * sheet re-renders this subtree and nothing above it.
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
    handleActionSheetBlockUser,
    handleActionSheetReportUser,
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

  const selectedMessageId = selectedMessage?.messageData.message_id?.trim();

  const canBlockMessageAuthor = canBlockUserId(
    selectedMessage?.userId,
    currentUserId,
  );

  const canBlockSelectedUser = canBlockUserId(
    selectedUser?.userId,
    currentUserId,
  );

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
          onReportUser={handleActionSheetReportUser}
          onBlockUser={
            canBlockMessageAuthor ? handleActionSheetBlockUser : undefined
          }
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
