import { memo } from 'react';
import { Portal } from 'react-native-teleport';

import { ActionSheet } from './ActionSheet/ActionSheet';
import {
  MESSAGE_ACTION_PREVIEW_PORTAL_INSTANCE_NAME,
  MESSAGE_ACTION_PREVIEW_PORTAL_NAME,
  MessageActionPreview,
} from './ActionSheet/MessageActionPreview';
import { BadgePreviewSheet } from './BadgePreviewSheet/BadgePreviewSheet';

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
  canModerateSelectedUser: boolean;
  canPinSelectedMessage: boolean;
  connected: boolean;
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
    canModerateSelectedUser,
    canPinSelectedMessage,
    connected,
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
        {connected && shouldRenderEmoteSheet ? (
          <EmoteSheet
            isPresented={shouldRenderEmoteSheet}
            onDismiss={onEmoteSheetDidDismiss}
            onEmoteSelect={onEmoteSelect}
          />
        ) : null}

        {shouldRenderSettingsSheet ? (
          <SettingsSheet
            chatDensity={chatDensity}
            highlightOwnMentions={highlightOwnMentions}
            isPresented={shouldRenderSettingsSheet}
            onClearChatCache={onClearChatCache}
            onClearImageCache={onClearImageCache}
            onClearSevenTvCosmeticsCache={onClearSevenTvCosmeticsCache}
            onDismiss={onSettingsSheetDidDismiss}
            onRefetchEmotes={onSettingsRefetchEmotes}
            onReconnect={onSettingsReconnect}
            onToggleChatDensity={onToggleChatDensity}
            onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
            onToggleInlineReplyContext={onToggleInlineReplyContext}
            onToggleShowTimestamps={onToggleShowTimestamps}
            onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
            showInlineReplyContext={showInlineReplyContext}
            showTimestamps={showTimestamps}
            showUnreadJumpPill={showUnreadJumpPill}
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
          <>
            <ActionSheet
              visible
              onClose={onCloseSelectedMessage}
              username={selectedMessage.username}
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
                highlightedUsers.includes(
                  selectedMessage.username.toLowerCase(),
                ),
              )}
            />
            <Portal
              hostName={MESSAGE_ACTION_PREVIEW_PORTAL_NAME}
              name={MESSAGE_ACTION_PREVIEW_PORTAL_INSTANCE_NAME}
            >
              <MessageActionPreview
                message={selectedMessage.message}
                username={selectedMessage.username}
              />
            </Portal>
          </>
        ) : null}

        {selectedUser ? (
          <UserActionSheet
            visible
            onClose={onCloseSelectedUser}
            username={selectedUser.username}
            login={selectedUser.login}
            onMentionUser={onMentionSelectedUser}
            onCopyUsername={onCopySelectedUsername}
            onHideUser={onHideSelectedUser}
            onHighlightUser={onHighlightSelectedUser}
            onTimeoutUser={onTimeoutSelectedUser}
            onBanUser={onBanSelectedUser}
            isHidden={hiddenUsers.includes(selectedUser.username.toLowerCase())}
            isHighlighted={highlightedUsers.includes(
              selectedUser.username.toLowerCase(),
            )}
            canModerateChat={canModerateChat}
            canModerateUser={canModerateSelectedUser}
          />
        ) : null}
      </>
    );
  },
);

ChatOverlayLayer.displayName = 'ChatOverlayLayer';
