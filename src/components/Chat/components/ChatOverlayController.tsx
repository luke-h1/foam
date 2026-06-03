import type { ChatMessageType } from '@app/store/chatStore/constants';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { useObservable, useSelector } from '@legendapp/state/react';
import * as Clipboard from 'expo-clipboard';
import { forwardRef, memo, useCallback, useImperativeHandle } from 'react';
import { toast } from 'sonner-native';

import type { EmotePickerItem } from './EmoteSheet/EmoteSheet';
import { ChatOverlayLayer } from './ChatOverlayLayer';
import {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './ChatMessage/RichChatMessage.types';

export interface ChatOverlayControllerHandle {
  openBadge: (badge: BadgePressData) => void;
  openEmotePreview: (emote: EmotePressData) => void;
  openEmoteSheet: () => void;
  openMessageActions: (message: MessageActionData<'usernotice'>) => void;
  openSettingsSheet: () => void;
  openUserActions: (user: UsernamePressData) => void;
}

interface ChatOverlayControllerProps {
  appendMentionToComposer: (username: string) => void;
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
}

interface ChatOverlayState {
  channelId: string;
  isEmoteSheetMounted: boolean;
  isSettingsSheetMounted: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
}

function createEmptyOverlayState(channelId: string): ChatOverlayState {
  return {
    channelId,
    isEmoteSheetMounted: false,
    isSettingsSheetMounted: false,
    selectedBadge: null,
    selectedEmote: null,
    selectedMessage: null,
    selectedUser: null,
  };
}

export const ChatOverlayController = memo(
  forwardRef<ChatOverlayControllerHandle, ChatOverlayControllerProps>(
    (
      {
        appendMentionToComposer,
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
      },
      ref,
    ) => {
      const overlay$ = useObservable(createEmptyOverlayState(channelId));
      const overlay = useSelector(overlay$);
      const {
        isEmoteSheetMounted,
        isSettingsSheetMounted,
        selectedBadge,
        selectedEmote,
        selectedMessage,
        selectedUser,
      } =
        overlay.channelId === channelId
          ? overlay
          : createEmptyOverlayState(channelId);

      const replaceOverlay = useCallback(
        (patch: Partial<ChatOverlayState>) => {
          overlay$.set({
            ...createEmptyOverlayState(channelId),
            ...patch,
            channelId,
          });
        },
        [channelId, overlay$],
      );

      const patchOverlay = useCallback(
        (patch: Partial<ChatOverlayState>) => {
          const current = overlay$.peek();
          overlay$.set({
            ...(current.channelId === channelId
              ? current
              : createEmptyOverlayState(channelId)),
            ...patch,
            channelId,
          });
        },
        [channelId, overlay$],
      );

      const openBadgeActions = useCallback(
        (badge: BadgePressData) => {
          replaceOverlay({ selectedBadge: badge });
        },
        [replaceOverlay],
      );

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
          openBadge: openBadgeActions,
          openEmotePreview,
          openEmoteSheet,
          openMessageActions,
          openSettingsSheet,
          openUserActions,
        }),
        [
          openBadgeActions,
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
        const target =
          selectedMessage?.login?.trim() || selectedMessage?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/timeout ${target} 600`);
        toast.success(`Timeout command sent for ${target}`);
        patchOverlay({ selectedMessage: null });
      }, [
        channelName,
        patchOverlay,
        selectedMessage?.login,
        selectedMessage?.username,
        sendChatCommand,
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
        const target =
          selectedUser?.login?.trim() || selectedUser?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/timeout ${target} 600`);
        toast.success(`Timeout command sent for ${target}`);
        patchOverlay({ selectedUser: null });
      }, [channelName, patchOverlay, selectedUser, sendChatCommand]);

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

      const handleCloseSelectedBadge = useCallback(() => {
        patchOverlay({ selectedBadge: null });
      }, [patchOverlay]);

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
        <ChatOverlayLayer
          canDeleteSelectedMessage={canDeleteSelectedMessage}
          canModerateChat={canModerateChat}
          canModerateSelectedMessageUser={canModerateSelectedMessageUser}
          canModerateSelectedUser={canModerateSelectedUser}
          canPinSelectedMessage={canPinSelectedMessage}
          disableEmoteAnimations={disableEmoteAnimations}
          highlightedUsers={highlightedUsers}
          hiddenUsers={hiddenUsers}
          onActionSheetBanUser={handleActionSheetBanUser}
          onActionSheetCopy={handleActionSheetCopy}
          onActionSheetDeleteMessage={handleActionSheetDeleteMessage}
          onActionSheetHidePhrase={handleActionSheetHidePhrase}
          onActionSheetHideUser={handleActionSheetHideUser}
          onActionSheetHighlightUser={handleActionSheetHighlightUser}
          onActionSheetPinMessage={handleActionSheetPinMessage}
          onActionSheetReply={handleActionSheetReply}
          onActionSheetUpdatePinnedMessage={
            handleActionSheetUpdatePinnedMessage
          }
          onActionSheetUnpinPinnedMessage={handleActionSheetUnpinPinnedMessage}
          onActionSheetTimeoutUser={handleActionSheetTimeoutUser}
          onBanSelectedUser={handleBanSelectedUser}
          onClearChatCache={onClearChatCache}
          onClearImageCache={onClearImageCache}
          onClearSevenTvCosmeticsCache={onClearSevenTvCosmeticsCache}
          onCloseSelectedBadge={handleCloseSelectedBadge}
          onCloseSelectedEmote={handleCloseSelectedEmote}
          onCloseSelectedMessage={handleCloseSelectedMessage}
          onCloseSelectedUser={handleCloseSelectedUser}
          onCopySelectedUsername={handleCopySelectedUsername}
          onEmoteSheetDidDismiss={handleEmoteSheetDidDismiss}
          onEmoteSelect={handleEmoteSelect}
          onSettingsSheetDidDismiss={handleSettingsSheetDidDismiss}
          onHighlightSelectedUser={handleHighlightSelectedUser}
          onHideSelectedUser={handleHideSelectedUser}
          onMentionSelectedUser={handleMentionSelectedUser}
          onSettingsReconnect={onSettingsReconnect}
          onSettingsRefetchEmotes={onSettingsRefetchEmotes}
          onTimeoutSelectedUser={handleTimeoutSelectedUser}
          onToggleChatDensity={onToggleChatDensity}
          onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
          onToggleInlineReplyContext={onToggleInlineReplyContext}
          onToggleShowTimestamps={onToggleShowTimestamps}
          onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
          selectedBadge={selectedBadge}
          selectedEmote={selectedEmote}
          selectedMessage={selectedMessage}
          selectedUser={selectedUser}
          shouldRenderSettingsSheet={isSettingsSheetMounted}
          shouldRenderEmoteSheet={isEmoteSheetMounted}
          pinnedMessageBusy={pinnedMessageBusy}
          pinnedMessageId={pinnedMessageId}
          chatDensity={chatDensity}
          highlightOwnMentions={highlightOwnMentions}
          showInlineReplyContext={showInlineReplyContext}
          showTimestamps={showTimestamps}
          showUnreadJumpPill={showUnreadJumpPill}
        />
      );
    },
  ),
);

ChatOverlayController.displayName = 'ChatOverlayController';
