import { memo } from 'react';

import { useChatOverlayActions } from '@app/components/chat/hooks/use-chat-interaction-handlers';
import { useChatOverlayHandlers } from '@app/components/chat/hooks/use-chat-overlay-handlers';
import { resolveModTarget } from '@app/components/chat/util/mod-commands/resolveModTarget';
import {
  closeChatEmoteActions,
  openChatUserActions,
} from '@app/store/chat/actions/chat-overlays';
import { getUserMessageColor } from '@app/store/chat/actions/message-color-index';
import { useChatOverlayState } from '@app/store/chat/react/overlay-selectors';
import type { MessageActionData } from '@app/store/chat/types/chat-press-data';
import { usePreference } from '@app/store/preference-store';
import type { ChatMessageType } from '@app/types/chat/chatMessage';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolveCachedSenderColor';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

import { ActionSheet } from './action-sheet/ActionSheet';
import { AssetPreviewSheet } from './asset-preview-sheet/AssetPreviewSheet';
import { ChatDebugLogRecorder } from './ChatDebugLogRecorder';
import { ChattersSheet } from './chatters-sheet/ChattersSheet';
import { EmoteActionSheet } from './emote-action-sheet/EmoteActionSheet';
import { EmoteSheet } from './emote-sheet/EmoteSheet';
import type { EmotePickerItem } from './emote-sheet/util/emoteSheetTypes';
import { SavedPhrasesSheet } from './saved-phrases-sheet/SavedPhrasesSheet';
import { SettingsSheet } from './settings-sheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';

/**
 * Twitch only blocks by user id, and a user cannot block themselves.
 */
function canBlockUserId(userId: string | undefined, currentUserId?: string) {
  const target = userId?.trim();
  return Boolean(target && target !== currentUserId);
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
    selectedEmoteAction,
    selectedMessage,
    selectedUser,
  } = useChatOverlayState(channelId);

  const chatDebugTools = usePreference('chatDebugTools');
  const disableEmoteAnimations = usePreference('disableEmoteAnimations');
  const { handleEmotePress } = useChatOverlayActions(channelId);

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
          onDismiss={handleEmoteSheetDidDismiss}
          onEmoteSelect={onInsertEmote}
        />
      ) : null}

      {isSettingsSheetMounted ? (
        <SettingsSheet
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
          onDismiss={handleChattersSheetDidDismiss}
          onSelectChatter={chatter => openChatUserActions(channelId, chatter)}
        />
      ) : null}

      {isSavedPhrasesSheetMounted ? (
        <SavedPhrasesSheet
          onDismiss={handleSavedPhrasesSheetDidDismiss}
          onSelectPhrase={onInsertPhrase}
        />
      ) : null}

      {selectedBadge ? (
        <AssetPreviewSheet
          kind='badge'
          asset={selectedBadge}
          onDismiss={handleCloseSelectedBadge}
        />
      ) : null}

      {selectedEmote ? (
        <AssetPreviewSheet
          kind='emote'
          asset={selectedEmote}
          onDismiss={handleCloseSelectedEmote}
        />
      ) : null}

      {selectedEmoteAction ? (
        <EmoteActionSheet
          disableAnimations={disableEmoteAnimations}
          onDismiss={() => closeChatEmoteActions(channelId)}
          onPress={handleEmotePress}
          token={selectedEmoteAction}
        />
      ) : null}

      {selectedMessage ? (
        <ActionSheet
          {...{
            onDismiss: handleCloseSelectedMessage,
            username: selectedMessage.username,
            usernameColor: resolveCachedSenderColor(
              selectedMessage.messageData,
              getUserMessageColor,
            ),
            messagePreview: selectedMessage.message,
            onReply: handleActionSheetReply,
            onCopy: handleActionSheetCopy,
            onHidePhrase: handleActionSheetHidePhrase,
            onHideUser: handleActionSheetHideUser,
            onHighlightUser: handleActionSheetHighlightUser,
            onPinMessage: handleActionSheetPinMessage,
            onUpdatePinnedMessage: handleActionSheetUpdatePinnedMessage,
            onUnpinMessage: onUnpinPinnedMessage,
            onDeleteMessage: handleActionSheetDeleteMessage,
            onTimeoutUser: handleActionSheetTimeoutUser,
            onBanUser: handleActionSheetBanUser,
            canModerateChat,
            onReportUser: handleActionSheetReportUser,
            onBlockUser: canBlockMessageAuthor
              ? handleActionSheetBlockUser
              : undefined,
            canDeleteMessage: Boolean(selectedMessageId),
            canPinMessage: Boolean(selectedMessageId),
            canModerateUser: Boolean(resolveModTarget(selectedMessage)),
            isPinnedMessage:
              pinnedMessageId === selectedMessage.messageData.message_id,
            isPinnedMessageBusy: pinnedMessageBusy,
            isUserHighlighted: highlightedUsers.includes(
              normaliseChatUsername(selectedMessage.username),
            ),
          }}
        />
      ) : null}

      {selectedUser ? (
        <UserActionSheet
          visibility={{
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
          {...{
            onDismiss: handleCloseSelectedUser,
            username: selectedUser.username,
            login: selectedUser.login,
            userId: selectedUser.userId,
            color: selectedUser.color,
            onMentionUser: handleMentionSelectedUser,
            onCopyUsername: handleCopySelectedUsername,
            onHideUser: handleHideSelectedUser,
            onHighlightUser: handleHighlightSelectedUser,
            onBlockUser: canBlockSelectedUser
              ? handleBlockSelectedUser
              : undefined,
            onReportUser: handleReportSelectedUser,
            onTimeoutUser: handleTimeoutSelectedUser,
            onWarnUser: handleWarnSelectedUser,
            onBanUser: handleBanSelectedUser,
          }}
        />
      ) : null}
    </>
  );
});
