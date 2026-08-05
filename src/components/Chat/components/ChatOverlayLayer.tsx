import { memo, useCallback } from 'react';
import { Alert } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import i18next from '@app/i18n/i18next';
import { queryClient } from '@app/lib/react-query/query-client';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import {
  closeChatOverlay,
  openChatMessageSearch,
  openChattersSheet,
  openChatUserActions,
  openSavedPhrasesSheet,
} from '@app/store/chat/actions/chatOverlays';
import { useChatOverlayState } from '@app/store/chat/react/overlaySelectors';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { showActionMenu } from '@app/store/overlays/showActionMenu';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import type { ModCommand } from '../util/modCommands/parseModCommand';
import { runModCommand } from '../util/modCommands/runModCommand';
import { ActionSheet } from './ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './BadgePreviewSheet/BadgePreviewSheet';
import type { MessageActionData } from './ChatMessage/RichChatMessage.types';
import { ChattersSheet } from './ChattersSheet/ChattersSheet';
import { EmotePreviewSheet } from './EmotePreviewSheet/EmotePreviewSheet';
import { EmoteSheet } from './EmoteSheet/EmoteSheet';
import type { EmotePickerItem } from './EmoteSheet/emoteSheetTypes';
import { SavedPhrasesSheet } from './SavedPhrasesSheet/SavedPhrasesSheet';
import { SettingsSheet } from './SettingsSheet/SettingsSheet';
import { UserActionSheet } from './UserActionSheet';

const TIMEOUT_DURATION_OPTIONS = [
  { labelKey: 'chat:userActions.timeoutDuration10Seconds', seconds: 10 },
  { labelKey: 'chat:userActions.timeoutDuration1Minute', seconds: 60 },
  { labelKey: 'chat:userActions.timeoutDuration10Minutes', seconds: 600 },
  { labelKey: 'chat:userActions.timeoutDuration30Minutes', seconds: 1800 },
  { labelKey: 'chat:userActions.timeoutDuration1Hour', seconds: 3600 },
  { labelKey: 'chat:userActions.timeoutDuration1Day', seconds: 86400 },
] as const satisfies readonly { labelKey: string; seconds: number }[];

function resolveModTarget(
  selection: { login?: string; username?: string } | null | undefined,
): string | undefined {
  return selection?.login?.trim() || selection?.username?.trim() || undefined;
}

export interface ChatOverlayLayerProps {
  canModerateChat: boolean;
  channelId: string;
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

  /**
   * Twitch dropped IRC slash commands in 2023; Helix 403 = not a mod.
   */
  const runModAction = useCallback(
    (command: ModCommand) => {
      runModCommand(command, channelId, currentUserId);
    },
    [channelId, currentUserId],
  );

  const banSelection = useCallback(
    (selection: { login?: string; username?: string } | null) => {
      const target = resolveModTarget(selection);
      if (!target) {
        return;
      }

      runModAction({ type: 'ban', login: target });
    },
    [runModAction],
  );

  const promptTimeoutDuration = useCallback(
    (selection: { login?: string; username?: string } | null) => {
      const target = resolveModTarget(selection);
      if (!target) {
        return;
      }

      showActionMenu({
        title: i18next.t('chat:userActions.timeoutDurationTitle', {
          name: target,
        }),
        actions: TIMEOUT_DURATION_OPTIONS.map(option => ({
          label: i18next.t(option.labelKey),
          onPress: () => {
            runModAction({
              type: 'timeout',
              login: target,
              durationSeconds: option.seconds,
            });
          },
        })),
        cancelLabel: i18next.t('common:cancel'),
      });
    },
    [runModAction],
  );

  const handleActionSheetReply = useCallback(() => {
    if (selectedMessage) {
      onReply(selectedMessage.messageData);
    }
  }, [onReply, selectedMessage]);

  const handleActionSheetCopy = useCallback(() => {
    if (!selectedMessage) {
      return;
    }

    void Clipboard.setStringAsync(
      replaceEmotesWithText(selectedMessage.message),
    ).then(() =>
      toast.success(i18next.t('chat:userActions.copiedToClipboard')),
    );
  }, [selectedMessage]);

  const handleActionSheetHideUser = useCallback(() => {
    hideUserFromView(selectedMessage?.username);
  }, [hideUserFromView, selectedMessage]);

  const handleActionSheetHighlightUser = useCallback(() => {
    toggleHighlightedUser(selectedMessage?.username);
  }, [selectedMessage, toggleHighlightedUser]);

  const handleActionSheetHidePhrase = useCallback(() => {
    if (selectedMessage) {
      hidePhraseFromView(replaceEmotesWithText(selectedMessage.message));
    }
  }, [hidePhraseFromView, selectedMessage]);

  const handleActionSheetDeleteMessage = useCallback(() => {
    const messageId = selectedMessage?.messageData.message_id?.trim();
    const moderatorId = currentUserId?.trim();
    if (!messageId || !moderatorId) {
      return;
    }

    twitchService
      .deleteChatMessage(channelId, moderatorId, messageId)
      .then(() =>
        toast.success(i18next.t('chat:userActions.deleteCommandSent')),
      )
      .catch((error: unknown) => {
        logger.chat.warn('Failed to delete chat message', {
          error,
          channel_id: channelId,
        });
        toast.error(i18next.t('chat:modCommands.failed'));
      });
  }, [channelId, currentUserId, selectedMessage?.messageData.message_id]);

  const handleActionSheetPinMessage = useCallback(() => {
    if (selectedMessage) {
      onPinMessage(selectedMessage);
    }
  }, [onPinMessage, selectedMessage]);

  const handleActionSheetUpdatePinnedMessage = useCallback(() => {
    const messageId = selectedMessage?.messageData.message_id?.trim();
    if (messageId) {
      onRefreshPinnedMessage(messageId);
    }
  }, [onRefreshPinnedMessage, selectedMessage?.messageData.message_id]);

  const handleActionSheetTimeoutUser = useCallback(() => {
    promptTimeoutDuration(selectedMessage);
  }, [promptTimeoutDuration, selectedMessage]);

  const handleActionSheetBanUser = useCallback(() => {
    banSelection(selectedMessage);
  }, [banSelection, selectedMessage]);

  const handleMentionSelectedUser = useCallback(() => {
    if (selectedUser?.username) {
      onAppendMention(selectedUser.username);
    }
  }, [onAppendMention, selectedUser]);

  const handleCopySelectedUsername = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    void Clipboard.setStringAsync(selectedUser.username).then(() =>
      toast.success(i18next.t('chat:userActions.copiedUsername')),
    );
  }, [selectedUser]);

  const handleHideSelectedUser = useCallback(() => {
    hideUserFromView(selectedUser?.username);
  }, [hideUserFromView, selectedUser]);

  const handleHighlightSelectedUser = useCallback(() => {
    toggleHighlightedUser(selectedUser?.username);
  }, [selectedUser, toggleHighlightedUser]);

  const handleTimeoutSelectedUser = useCallback(() => {
    promptTimeoutDuration(selectedUser);
  }, [promptTimeoutDuration, selectedUser]);

  const handleBanSelectedUser = useCallback(() => {
    banSelection(selectedUser);
  }, [banSelection, selectedUser]);

  const handleWarnSelectedUser = useCallback(() => {
    const target = resolveModTarget(selectedUser);
    if (!target) {
      return;
    }

    const warnWithReason = (reason: string) => {
      runModAction({ type: 'warn', login: target, reason });
    };

    showActionMenu({
      title: i18next.t('chat:userActions.warnReasonTitle', { name: target }),
      actions: [
        {
          label: i18next.t('chat:userActions.warnReasonSpam'),
          onPress: () =>
            warnWithReason(i18next.t('chat:userActions.warnReasonSpam')),
        },
        {
          label: i18next.t('chat:userActions.warnReasonHarassment'),
          onPress: () =>
            warnWithReason(i18next.t('chat:userActions.warnReasonHarassment')),
        },
        {
          label: i18next.t('chat:userActions.warnReasonRules'),
          onPress: () =>
            warnWithReason(i18next.t('chat:userActions.warnReasonRules')),
        },
      ],
      cancelLabel: i18next.t('common:cancel'),
    });
  }, [runModAction, selectedUser]);

  // Twitch has no public report API; the report form is web-only.
  const handleReportSelectedUser = useCallback(() => {
    const target = resolveModTarget(selectedUser)?.toLowerCase();
    if (target) {
      openLinkInBrowser(`https://www.twitch.tv/${target}/report`);
    }
  }, [selectedUser]);

  const handleBlockSelectedUser = useCallback(() => {
    const targetUserId = selectedUser?.userId?.trim();
    const displayName =
      selectedUser?.username?.trim() || selectedUser?.login?.trim();
    if (!targetUserId || !displayName) {
      return;
    }

    Alert.alert(
      i18next.t('chat:userActions.blockUser'),
      i18next.t('chat:userActions.blockUserConfirm', { name: displayName }),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('chat:userActions.block'),
          style: 'destructive',
          onPress: () => {
            twitchService
              .blockUser(targetUserId, 'chat')
              .then(() => {
                toast.success(`Blocked ${displayName}`);
                if (currentUserId) {
                  void queryClient.invalidateQueries({
                    queryKey: twitchKeys.blockList(currentUserId),
                  });
                }
              })
              .catch(() => {
                toast.error(i18next.t('chat:userActions.failedToBlockUser'));
              });
          },
        },
      ],
    );
  }, [currentUserId, selectedUser]);

  const handleCloseSelectedBadge = useCallback(() => {
    closeChatOverlay(channelId, { selectedBadge: null });
  }, [channelId]);

  const handleCloseSelectedEmote = useCallback(() => {
    closeChatOverlay(channelId, { selectedEmote: null });
  }, [channelId]);

  const handleCloseSelectedMessage = useCallback(() => {
    closeChatOverlay(channelId, { selectedMessage: null });
  }, [channelId]);

  const handleCloseSelectedUser = useCallback(() => {
    closeChatOverlay(channelId, { selectedUser: null });
  }, [channelId]);

  const handleEmoteSheetDidDismiss = useCallback(() => {
    closeChatOverlay(channelId, { isEmoteSheetMounted: false });
  }, [channelId]);

  const handleSettingsSheetDidDismiss = useCallback(() => {
    closeChatOverlay(channelId, { isSettingsSheetMounted: false });
  }, [channelId]);

  const handleChattersSheetDidDismiss = useCallback(() => {
    closeChatOverlay(channelId, { isChattersSheetMounted: false });
  }, [channelId]);

  const handleSavedPhrasesSheetDidDismiss = useCallback(() => {
    closeChatOverlay(channelId, { isSavedPhrasesSheetMounted: false });
  }, [channelId]);

  const handleOpenChatters = useCallback(() => {
    openChattersSheet(channelId);
  }, [channelId]);

  const handleOpenMessageSearch = useCallback(() => {
    openChatMessageSearch(channelId);
  }, [channelId]);

  const handleOpenSavedPhrases = useCallback(() => {
    openSavedPhrasesSheet(channelId);
  }, [channelId]);

  const selectedUserId = selectedUser?.userId?.trim();
  const canBlockSelectedUser = Boolean(
    selectedUserId &&
    /^\d+$/.test(selectedUserId) &&
    selectedUserId !== currentUserId,
  );
  const selectedMessageId = selectedMessage?.messageData.message_id?.trim();

  return (
    <>
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
