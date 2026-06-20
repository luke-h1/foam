import { memo } from 'react';

import { ActionSheet } from './ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './BadgePreviewSheet/BadgePreviewSheet';
import { ChattersSheet } from './ChattersSheet/ChattersSheet';

import { EmotePreviewSheet } from './EmotePreviewSheet/EmotePreviewSheet';
import { EmoteSheet, type EmotePickerItem } from './EmoteSheet/EmoteSheet';
import { SettingsSheet } from './SettingsSheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';
import {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './ChatMessage/RichChatMessage.types';

export interface ChatOverlayLayerProps {
  canDeleteSelectedMessage: boolean;
  canModerateChat: boolean;
  canModerateSelectedMessageUser: boolean;
  canBlockSelectedUser: boolean;
  canModerateSelectedUser: boolean;
  canPinSelectedMessage: boolean;
  disableEmoteAnimations: boolean;
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
  onToggleChatDensity: () => void;
  onToggleHighlightOwnMentions: (value: boolean) => void;
  onToggleInlineReplyContext: (value: boolean) => void;
  onToggleShowTimestamps: (value: boolean) => void;
  onToggleShowUnreadJumpPill: (value: boolean) => void;
  onBanSelectedUser: () => void;
  onBlockSelectedUser: () => void;
  onReportSelectedUser: () => void;
  onChattersSheetDidDismiss: () => void;
  onOpenChatters: () => void;
  onSelectChatter: (chatter: UsernamePressData) => void;
  shouldRenderChattersSheet: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
  shouldRenderSettingsSheet: boolean;
  shouldRenderEmoteSheet: boolean;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  chatDensity: 'comfortable' | 'compact';
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
  showUnreadJumpPill: boolean;
}

export const ChatOverlayLayer = memo(
  ({
    canDeleteSelectedMessage,
    canModerateChat,
    canModerateSelectedMessageUser,
    canBlockSelectedUser,
    canModerateSelectedUser,
    canPinSelectedMessage,
    disableEmoteAnimations,
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
    onSelectChatter,
    shouldRenderChattersSheet,
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
    onToggleChatDensity,
    onToggleHighlightOwnMentions,
    onToggleInlineReplyContext,
    onToggleShowTimestamps,
    onToggleShowUnreadJumpPill,
    selectedBadge,
    selectedEmote,
    selectedMessage,
    selectedUser,
    shouldRenderSettingsSheet,
    shouldRenderEmoteSheet,
    pinnedMessageBusy,
    pinnedMessageId,
    chatDensity,
    highlightOwnMentions,
    showInlineReplyContext,
    showTimestamps,
    showUnreadJumpPill,
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
            preferenceFlags={{
              chatDensity,
              highlightOwnMentions,
              showInlineReplyContext,
              showTimestamps,
              showUnreadJumpPill,
            }}
            onClearChatCache={onClearChatCache}
            onClearImageCache={onClearImageCache}
            onClearSevenTvCosmeticsCache={onClearSevenTvCosmeticsCache}
            onDismiss={onSettingsSheetDidDismiss}
            onOpenChatters={onOpenChatters}
            onRefetchEmotes={onSettingsRefetchEmotes}
            onReconnect={onSettingsReconnect}
            onToggleChatDensity={onToggleChatDensity}
            onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
            onToggleInlineReplyContext={onToggleInlineReplyContext}
            onToggleShowTimestamps={onToggleShowTimestamps}
            onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
          />
        ) : null}

        {shouldRenderChattersSheet ? (
          <ChattersSheet
            isPresented={shouldRenderChattersSheet}
            onDismiss={onChattersSheetDidDismiss}
            onSelectChatter={onSelectChatter}
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
            disableAnimations={disableEmoteAnimations}
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
            handleReply={onActionSheetReply}
            handleCopy={onActionSheetCopy}
            handleHidePhrase={onActionSheetHidePhrase}
            handleHideUser={onActionSheetHideUser}
            handleHighlightUser={onActionSheetHighlightUser}
            handlePinMessage={onActionSheetPinMessage}
            handleUpdatePinnedMessage={onActionSheetUpdatePinnedMessage}
            handleUnpinMessage={onActionSheetUnpinPinnedMessage}
            handleDeleteMessage={onActionSheetDeleteMessage}
            handleTimeoutUser={onActionSheetTimeoutUser}
            handleBanUser={onActionSheetBanUser}
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
            onBanUser={onBanSelectedUser}
          />
        ) : null}
      </>
    );
  },
);

ChatOverlayLayer.displayName = 'ChatOverlayLayer';
