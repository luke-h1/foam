import type { ChatMessageType } from '@app/store/chat/types/constants';
import { useChatOverlayState } from '@app/store/chat/react/overlayState';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useImperativeHandle, type Ref } from 'react';
import { Portal } from 'react-native-teleport';
import { toast } from 'sonner-native';

import { ActionSheet } from './ActionSheet/ActionSheet';
import {
  MESSAGE_ACTION_PREVIEW_PORTAL_INSTANCE_NAME,
  MESSAGE_ACTION_PREVIEW_PORTAL_NAME,
  MessageActionPreview,
} from './MessageActionPreview/MessageActionPreview';
import {
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './ChatMessage/RichChatMessage.types';
import type { EmotePickerItem } from './EmoteSheet/components/EmoteCell';
import { EmotePreviewSheet } from './EmotePreviewSheet/EmotePreviewSheet';
import { EmoteSheet } from './EmoteSheet/EmoteSheet';
import { SettingsSheet } from './SettingsSheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';

export interface ChatOverlaysHandle {
  openEmotePreview: (emote: EmotePressData) => void;
  openEmoteSheet: () => void;
  openMessageActions: (message: MessageActionData<'usernotice'>) => void;
  openSettingsSheet: () => void;
  openUserActions: (user: UsernamePressData) => void;
}

interface ChatOverlaysProps {
  appendMentionToComposer: (username: string) => void;
  prepareTimeoutCommand: (login: string) => void;
  canModerateChat: boolean;
  channelId: string;
  channelName: string;
  disableEmoteAnimations: boolean;
  handleReply: (message: ChatMessageType<'usernotice'>) => void;
  hiddenUsers: string[];
  highlightedUsers: string[];
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onClearSevenTvCosmeticsCache: () => void;
  onInsertEmote: (item: EmotePickerItem) => void;
  onPinMessage: (message: MessageActionData<'usernotice'>) => void;
  onRefreshPinnedMessage: (messageId: string) => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onToggleChatDensity: () => void;
  onToggleHighlightOwnMentions: (value: boolean) => void;
  onToggleInlineReplyContext: (value: boolean) => void;
  onToggleShowTimestamps: (value: boolean) => void;
  onToggleShowUnreadJumpPill: (value: boolean) => void;
  onUnpinPinnedMessage: () => void;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  sendChatCommand: (channel: string, message: string) => void;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
  showUnreadJumpPill: boolean;
  chatDensity: 'comfortable' | 'compact';
  highlightOwnMentions: boolean;
  toggleHighlightedUser: (username?: string) => void;
  ref?: Ref<ChatOverlaysHandle>;
}

export const ChatOverlays = memo(function ChatOverlays({
  appendMentionToComposer,
  prepareTimeoutCommand,
  canModerateChat,
  channelId,
  channelName,
  disableEmoteAnimations,
  handleReply,
  hiddenUsers,
  highlightedUsers,
  hidePhraseFromView,
  hideUserFromView,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onInsertEmote,
  onPinMessage,
  onRefreshPinnedMessage,
  onSettingsReconnect,
  onSettingsRefetchEmotes,
  onToggleChatDensity,
  onToggleHighlightOwnMentions,
  onToggleInlineReplyContext,
  onToggleShowTimestamps,
  onToggleShowUnreadJumpPill,
  onUnpinPinnedMessage,
  pinnedMessageBusy,
  pinnedMessageId,
  sendChatCommand,
  showInlineReplyContext,
  showTimestamps,
  showUnreadJumpPill,
  chatDensity,
  highlightOwnMentions,
  toggleHighlightedUser,
  ref,
}: ChatOverlaysProps) {
  const { overlay, patchOverlay, replaceOverlay } = useChatOverlayState<
    EmotePressData,
    MessageActionData<'usernotice'>,
    UsernamePressData
  >(channelId);

  const {
    isEmoteSheetMounted,
    isSettingsSheetMounted,
    selectedEmote,
    selectedMessage,
    selectedUser,
  } = overlay;

  const openEmotePreview = useCallback(
    (emote: EmotePressData) => {
      replaceOverlay({ selectedEmote: emote });
    },
    [replaceOverlay],
  );

  const openEmoteSheet = useCallback(() => {
    replaceOverlay({ isEmoteSheetMounted: true });
  }, [replaceOverlay]);

  const openMessageActions = useCallback(
    (message: MessageActionData<'usernotice'>) => {
      replaceOverlay({ selectedMessage: message });
    },
    [replaceOverlay],
  );

  const openSettingsSheet = useCallback(() => {
    replaceOverlay({ isSettingsSheetMounted: true });
  }, [replaceOverlay]);

  const openUserActions = useCallback(
    (user: UsernamePressData) => {
      replaceOverlay({ selectedUser: user });
    },
    [replaceOverlay],
  );

  useImperativeHandle(
    ref,
    () => ({
      openEmotePreview,
      openEmoteSheet,
      openMessageActions,
      openSettingsSheet,
      openUserActions,
    }),
    [
      openEmotePreview,
      openEmoteSheet,
      openMessageActions,
      openSettingsSheet,
      openUserActions,
    ],
  );

  const selectedMessageId = selectedMessage?.messageData.message_id?.trim();
  const canModerateSelectedMessageUser = Boolean(
    selectedMessage?.login?.trim() || selectedMessage?.username?.trim(),
  );
  const canDeleteSelectedMessage = Boolean(selectedMessageId);
  const canPinSelectedMessage = Boolean(
    !pinnedMessageBusy && selectedMessageId,
  );
  const canModerateSelectedUser = Boolean(
    selectedUser?.login?.trim() || selectedUser?.username.trim(),
  );

  const handleEmoteSheetDidDismiss = useCallback(() => {
    patchOverlay({ isEmoteSheetMounted: false });
  }, [patchOverlay]);

  const handleSettingsSheetDidDismiss = useCallback(() => {
    patchOverlay({ isSettingsSheetMounted: false });
  }, [patchOverlay]);

  const handleActionSheetReply = useCallback(() => {
    if (!selectedMessage) {
      return;
    }
    handleReply(selectedMessage.messageData);
    patchOverlay({ selectedMessage: null });
  }, [handleReply, patchOverlay, selectedMessage]);

  const handleActionSheetCopy = useCallback(() => {
    if (!selectedMessage) {
      return;
    }
    const messageText = replaceEmotesWithText(selectedMessage.message);
    void Clipboard.setStringAsync(messageText).then(() =>
      toast.success('Copied to clipboard'),
    );
    patchOverlay({ selectedMessage: null });
  }, [patchOverlay, selectedMessage]);

  const handleActionSheetHideUser = useCallback(() => {
    hideUserFromView(selectedMessage?.username);
    patchOverlay({ selectedMessage: null });
  }, [hideUserFromView, patchOverlay, selectedMessage]);

  const handleActionSheetHighlightUser = useCallback(() => {
    toggleHighlightedUser(selectedMessage?.username);
    patchOverlay({ selectedMessage: null });
  }, [patchOverlay, selectedMessage, toggleHighlightedUser]);

  const handleActionSheetHidePhrase = useCallback(() => {
    if (!selectedMessage) {
      return;
    }

    hidePhraseFromView(replaceEmotesWithText(selectedMessage.message));
    patchOverlay({ selectedMessage: null });
  }, [hidePhraseFromView, patchOverlay, selectedMessage]);

  const handleActionSheetDeleteMessage = useCallback(() => {
    const messageId = selectedMessage?.messageData.message_id?.trim();
    if (!messageId) {
      return;
    }

    sendChatCommand(channelName, `/delete ${messageId}`);
    toast.success('Delete command sent');
    patchOverlay({ selectedMessage: null });
  }, [
    channelName,
    patchOverlay,
    selectedMessage?.messageData.message_id,
    sendChatCommand,
  ]);

  const handleActionSheetPinMessage = useCallback(() => {
    if (!selectedMessage) {
      return;
    }

    onPinMessage(selectedMessage);
    patchOverlay({ selectedMessage: null });
  }, [onPinMessage, patchOverlay, selectedMessage]);

  const handleActionSheetUpdatePinnedMessage = useCallback(() => {
    const messageId = selectedMessage?.messageData.message_id?.trim();
    if (!messageId) {
      return;
    }

    onRefreshPinnedMessage(messageId);
    patchOverlay({ selectedMessage: null });
  }, [
    onRefreshPinnedMessage,
    patchOverlay,
    selectedMessage?.messageData.message_id,
  ]);

  const handleActionSheetUnpinPinnedMessage = useCallback(() => {
    onUnpinPinnedMessage();
    patchOverlay({ selectedMessage: null });
  }, [onUnpinPinnedMessage, patchOverlay]);

  const handleActionSheetTimeoutUser = useCallback(() => {
    if (!canModerateChat) {
      return;
    }

    const target =
      selectedMessage?.login?.trim() || selectedMessage?.username?.trim();
    if (!target) {
      return;
    }

    prepareTimeoutCommand(target);
    patchOverlay({ selectedMessage: null });
  }, [
    canModerateChat,
    patchOverlay,
    prepareTimeoutCommand,
    selectedMessage?.login,
    selectedMessage?.username,
  ]);

  const handleActionSheetBanUser = useCallback(() => {
    const target =
      selectedMessage?.login?.trim() || selectedMessage?.username?.trim();
    if (!target) {
      return;
    }

    sendChatCommand(channelName, `/ban ${target}`);
    toast.success(`Ban command sent for ${target}`);
    patchOverlay({ selectedMessage: null });
  }, [
    channelName,
    patchOverlay,
    selectedMessage?.login,
    selectedMessage?.username,
    sendChatCommand,
  ]);

  const handleMentionSelectedUser = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    appendMentionToComposer(selectedUser.username);
    patchOverlay({ selectedUser: null });
  }, [appendMentionToComposer, patchOverlay, selectedUser]);

  const handleCopySelectedUsername = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    void Clipboard.setStringAsync(selectedUser.username).then(() =>
      toast.success('Copied username'),
    );
    patchOverlay({ selectedUser: null });
  }, [patchOverlay, selectedUser]);

  const handleHideSelectedUser = useCallback(() => {
    hideUserFromView(selectedUser?.username);
    patchOverlay({ selectedUser: null });
  }, [hideUserFromView, patchOverlay, selectedUser]);

  const handleHighlightSelectedUser = useCallback(() => {
    toggleHighlightedUser(selectedUser?.username);
    patchOverlay({ selectedUser: null });
  }, [patchOverlay, selectedUser, toggleHighlightedUser]);

  const handleTimeoutSelectedUser = useCallback(() => {
    if (!canModerateChat) {
      return;
    }

    const target =
      selectedUser?.login?.trim() || selectedUser?.username?.trim();
    if (!target) {
      return;
    }

    prepareTimeoutCommand(target);
    patchOverlay({ selectedUser: null });
  }, [canModerateChat, patchOverlay, prepareTimeoutCommand, selectedUser]);

  const handleBanSelectedUser = useCallback(() => {
    const target =
      selectedUser?.login?.trim() || selectedUser?.username?.trim();
    if (!target) {
      return;
    }

    sendChatCommand(channelName, `/ban ${target}`);
    toast.success(`Ban command sent for ${target}`);
    patchOverlay({ selectedUser: null });
  }, [channelName, patchOverlay, selectedUser, sendChatCommand]);

  const handleCloseSelectedEmote = useCallback(() => {
    patchOverlay({ selectedEmote: null });
  }, [patchOverlay]);

  const handleCloseSelectedMessage = useCallback(() => {
    patchOverlay({ selectedMessage: null });
  }, [patchOverlay]);

  const handleCloseSelectedUser = useCallback(() => {
    patchOverlay({ selectedUser: null });
  }, [patchOverlay]);

  const handleEmoteSelect = useCallback(
    (item: EmotePickerItem) => {
      onInsertEmote(item);
      patchOverlay({ isEmoteSheetMounted: false });
    },
    [onInsertEmote, patchOverlay],
  );

  return (
    <>
      {isEmoteSheetMounted ? (
        <EmoteSheet
          isPresented={isEmoteSheetMounted}
          onDismiss={handleEmoteSheetDidDismiss}
          onEmoteSelect={handleEmoteSelect}
        />
      ) : null}

      {isSettingsSheetMounted ? (
        <SettingsSheet
          isPresented={isSettingsSheetMounted}
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
          onDismiss={handleSettingsSheetDidDismiss}
          onRefetchEmotes={onSettingsRefetchEmotes}
          onReconnect={onSettingsReconnect}
          onToggleChatDensity={onToggleChatDensity}
          onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
          onToggleInlineReplyContext={onToggleInlineReplyContext}
          onToggleShowTimestamps={onToggleShowTimestamps}
          onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
        />
      ) : null}

      {selectedEmote ? (
        <EmotePreviewSheet
          disableAnimations={disableEmoteAnimations}
          visible
          onClose={handleCloseSelectedEmote}
          selectedEmote={selectedEmote}
        />
      ) : null}

      {selectedMessage ? (
        <>
          <ActionSheet
            visible
            onClose={handleCloseSelectedMessage}
            username={selectedMessage.username}
            handleReply={handleActionSheetReply}
            handleCopy={handleActionSheetCopy}
            handleHidePhrase={handleActionSheetHidePhrase}
            handleHideUser={handleActionSheetHideUser}
            handleHighlightUser={handleActionSheetHighlightUser}
            handlePinMessage={handleActionSheetPinMessage}
            handleUpdatePinnedMessage={handleActionSheetUpdatePinnedMessage}
            handleUnpinMessage={handleActionSheetUnpinPinnedMessage}
            handleDeleteMessage={handleActionSheetDeleteMessage}
            handleTimeoutUser={handleActionSheetTimeoutUser}
            handleBanUser={handleActionSheetBanUser}
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
          visibility={{
            visible: true,
            isHidden: hiddenUsers.includes(selectedUser.username.toLowerCase()),
            isHighlighted: highlightedUsers.includes(
              selectedUser.username.toLowerCase(),
            ),
          }}
          moderation={{
            canModerateChat,
            canModerateUser: canModerateSelectedUser,
          }}
          onClose={handleCloseSelectedUser}
          username={selectedUser.username}
          login={selectedUser.login}
          onMentionUser={handleMentionSelectedUser}
          onCopyUsername={handleCopySelectedUsername}
          onHideUser={handleHideSelectedUser}
          onHighlightUser={handleHighlightSelectedUser}
          onTimeoutUser={handleTimeoutSelectedUser}
          onBanUser={handleBanSelectedUser}
        />
      ) : null}
    </>
  );
});
