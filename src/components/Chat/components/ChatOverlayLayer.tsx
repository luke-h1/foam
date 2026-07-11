import { memo } from 'react';

import { ActionSheet } from './ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './BadgePreviewSheet/BadgePreviewSheet';
import {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './ChatMessage/RichChatMessage.types';
import { ChattersSheet } from './ChattersSheet/ChattersSheet';
import { EmotePreviewSheet } from './EmotePreviewSheet/EmotePreviewSheet';
import { type EmotePickerItem, EmoteSheet } from './EmoteSheet/EmoteSheet';
import { SavedPhrasesSheet } from './SavedPhrasesSheet/SavedPhrasesSheet';
import { SettingsSheet } from './SettingsSheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';

export interface ChatOverlayLayerProps {
  canDeleteSelectedMessage: boolean;
  canModerateChat: boolean;
  canModerateSelectedMessageUser: boolean;
  canBlockSelectedUser: boolean;
  canModerateSelectedUser: boolean;
  canPinSelectedMessage: boolean;
  highlightedUsers: string[];
  hiddenUsers: string[];
  onActionSheetBanUser: () => void;
  onActionSheetCopy: () => void;
  onActionSheetDeleteMessage: () => void;
  onActionSheetHidePhrase: () => void;
  onActionSheetHideUser: () => void;
  onActionSheetHighlightUser: () => void;
  onActionSheetPinMessage: () => void;
  onActionSheetReply: () => void;
  onActionSheetUpdatePinnedMessage: () => void;
  onActionSheetUnpinPinnedMessage: () => void;
  onActionSheetTimeoutUser: () => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onClearSevenTvCosmeticsCache: () => void;
  onCloseSelectedBadge: () => void;
  onCloseSelectedEmote: () => void;
  onCloseSelectedMessage: () => void;
  onCloseSelectedUser: () => void;
  onCopySelectedUsername: () => void;
  onEmoteSheetDidDismiss: () => void;
  onEmoteSelect: (item: EmotePickerItem) => void;
  onSettingsSheetDidDismiss: () => void;
  onHighlightSelectedUser: () => void;
  onHideSelectedUser: () => void;
  onMentionSelectedUser: () => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onTimeoutSelectedUser: () => void;
  onWarnSelectedUser: () => void;
  onBanSelectedUser: () => void;
  onBlockSelectedUser: () => void;
  onReportSelectedUser: () => void;
  onChattersSheetDidDismiss: () => void;
  onOpenChatters: () => void;
  onOpenSavedPhrases: () => void;
  onSavedPhrasesSheetDidDismiss: () => void;
  onSelectChatter: (chatter: UsernamePressData) => void;
  onSelectSavedPhrase: (text: string) => void;
  shouldRenderChattersSheet: boolean;
  shouldRenderSavedPhrasesSheet: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
  shouldRenderSettingsSheet: boolean;
  shouldRenderEmoteSheet: boolean;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
}

export const ChatOverlayLayer = memo(
  ({
    canDeleteSelectedMessage,
    canModerateChat,
    canModerateSelectedMessageUser,
    canBlockSelectedUser,
    canModerateSelectedUser,
    canPinSelectedMessage,
    highlightedUsers,
    hiddenUsers,
    onActionSheetBanUser,
    onActionSheetCopy,
    onActionSheetDeleteMessage,
    onActionSheetHidePhrase,
    onActionSheetHideUser,
    onActionSheetHighlightUser,
    onActionSheetPinMessage,
    onActionSheetReply,
    onActionSheetUpdatePinnedMessage,
    onActionSheetUnpinPinnedMessage,
    onActionSheetTimeoutUser,
    onBanSelectedUser,
    onBlockSelectedUser,
    onReportSelectedUser,
    onChattersSheetDidDismiss,
    onOpenChatters,
    onOpenSavedPhrases,
    onSavedPhrasesSheetDidDismiss,
    onSelectChatter,
    onSelectSavedPhrase,
    shouldRenderChattersSheet,
    shouldRenderSavedPhrasesSheet,
    onClearChatCache,
    onClearImageCache,
    onClearSevenTvCosmeticsCache,
    onCloseSelectedBadge,
    onCloseSelectedEmote,
    onCloseSelectedMessage,
    onCloseSelectedUser,
    onCopySelectedUsername,
    onEmoteSheetDidDismiss,
    onEmoteSelect,
    onSettingsSheetDidDismiss,
    onHighlightSelectedUser,
    onHideSelectedUser,
    onMentionSelectedUser,
    onSettingsReconnect,
    onSettingsRefetchEmotes,
    onTimeoutSelectedUser,
    onWarnSelectedUser,
    selectedBadge,
    selectedEmote,
    selectedMessage,
    selectedUser,
    shouldRenderSettingsSheet,
    shouldRenderEmoteSheet,
    pinnedMessageBusy,
    pinnedMessageId,
  }: ChatOverlayLayerProps) => {
    return (
      <>
        {shouldRenderEmoteSheet ? (
          <EmoteSheet
            isPresented={shouldRenderEmoteSheet}
            onDismiss={onEmoteSheetDidDismiss}
            onEmoteSelect={onEmoteSelect}
          />
        ) : null}

        {shouldRenderSettingsSheet ? (
          <SettingsSheet
            isPresented={shouldRenderSettingsSheet}
            onClearChatCache={onClearChatCache}
            onClearImageCache={onClearImageCache}
            onClearSevenTvCosmeticsCache={onClearSevenTvCosmeticsCache}
            onDismiss={onSettingsSheetDidDismiss}
            onOpenChatters={onOpenChatters}
            onOpenSavedPhrases={onOpenSavedPhrases}
            onRefetchEmotes={onSettingsRefetchEmotes}
            onReconnect={onSettingsReconnect}
          />
        ) : null}

        {shouldRenderChattersSheet ? (
          <ChattersSheet
            isPresented={shouldRenderChattersSheet}
            onDismiss={onChattersSheetDidDismiss}
            onSelectChatter={onSelectChatter}
          />
        ) : null}

        {shouldRenderSavedPhrasesSheet ? (
          <SavedPhrasesSheet
            isPresented={shouldRenderSavedPhrasesSheet}
            onDismiss={onSavedPhrasesSheetDidDismiss}
            onSelectPhrase={onSelectSavedPhrase}
          />
        ) : null}

        {selectedBadge ? (
          <BadgePreviewSheet
            visible
            onClose={onCloseSelectedBadge}
            selectedBadge={selectedBadge}
          />
        ) : null}

        {selectedEmote ? (
          <EmotePreviewSheet
            visible
            onClose={onCloseSelectedEmote}
            selectedEmote={selectedEmote}
          />
        ) : null}

        {selectedMessage ? (
          <ActionSheet
            visible
            onClose={onCloseSelectedMessage}
            username={selectedMessage.username}
            messagePreview={selectedMessage.message}
            onReply={onActionSheetReply}
            onCopy={onActionSheetCopy}
            onHidePhrase={onActionSheetHidePhrase}
            onHideUser={onActionSheetHideUser}
            onHighlightUser={onActionSheetHighlightUser}
            onPinMessage={onActionSheetPinMessage}
            onUpdatePinnedMessage={onActionSheetUpdatePinnedMessage}
            onUnpinMessage={onActionSheetUnpinPinnedMessage}
            onDeleteMessage={onActionSheetDeleteMessage}
            onTimeoutUser={onActionSheetTimeoutUser}
            onBanUser={onActionSheetBanUser}
            canModerateChat={canModerateChat}
            canDeleteMessage={canDeleteSelectedMessage}
            canPinMessage={canPinSelectedMessage}
            canModerateUser={canModerateSelectedMessageUser}
            isPinnedMessage={
              pinnedMessageId === selectedMessage.messageData.message_id
            }
            isPinnedMessageBusy={pinnedMessageBusy}
            isUserHighlighted={Boolean(
              selectedMessage.username &&
              highlightedUsers.includes(selectedMessage.username.toLowerCase()),
            )}
          />
        ) : null}

        {selectedUser ? (
          <UserActionSheet
            visibility={{
              visible: true,
              isHidden: hiddenUsers.includes(
                selectedUser.username.toLowerCase(),
              ),
              isHighlighted: highlightedUsers.includes(
                selectedUser.username.toLowerCase(),
              ),
            }}
            moderation={{
              canModerateChat,
              canModerateUser: canModerateSelectedUser,
            }}
            onClose={onCloseSelectedUser}
            username={selectedUser.username}
            login={selectedUser.login}
            userId={selectedUser.userId}
            color={selectedUser.color}
            onMentionUser={onMentionSelectedUser}
            onCopyUsername={onCopySelectedUsername}
            onHideUser={onHideSelectedUser}
            onHighlightUser={onHighlightSelectedUser}
            onBlockUser={canBlockSelectedUser ? onBlockSelectedUser : undefined}
            onReportUser={onReportSelectedUser}
            onTimeoutUser={onTimeoutSelectedUser}
            onWarnUser={onWarnSelectedUser}
            onBanUser={onBanSelectedUser}
          />
        ) : null}
      </>
    );
  },
);

ChatOverlayLayer.displayName = 'ChatOverlayLayer';
