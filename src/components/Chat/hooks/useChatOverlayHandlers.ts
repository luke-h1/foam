import { useCallback } from 'react';
import { Alert } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import type {
  MessageActionData,
  UsernamePressData,
} from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';
import { queryClient } from '@app/lib/react-query/query-client';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import {
  closeChatOverlay,
  openChatMessageSearch,
  openChattersSheet,
  openSavedPhrasesSheet,
} from '@app/store/chat/actions/chatOverlays';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { showActionMenu } from '@app/store/overlays/showActionMenu';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import type { ModCommand } from '../util/modCommands/parseModCommand';
import { runModCommand } from '../util/modCommands/runModCommand';

const TIMEOUT_DURATION_OPTIONS = [
  { label: '10 seconds', seconds: 10 },
  { label: '1 minute', seconds: 60 },
  { label: '10 minutes', seconds: 600 },
  { label: '30 minutes', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: '24 hours', seconds: 86400 },
] as const satisfies readonly { label: string; seconds: number }[];

export function resolveModTarget(
  selection: { login?: string; username?: string } | null | undefined,
): string | undefined {
  return selection?.login?.trim() || selection?.username?.trim() || undefined;
}

interface UseChatOverlayHandlersOptions {
  channelId: string;
  currentUserId?: string;
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  onAppendMention: (username: string) => void;
  onPinMessage: (message: MessageActionData<'usernotice'>) => void;
  onRefreshPinnedMessage: (messageId: string) => void;
  onReply: (message: ChatMessageType<'usernotice'>) => void;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
  toggleHighlightedUser: (username?: string) => void;
}

/**
 * The actions the chat sheets fire. Split out of `ChatOverlayLayer` so that
 * component stays the sheet tree; it takes the current selection as arguments
 * rather than subscribing, so the overlay state still has exactly one reader.
 */
export function useChatOverlayHandlers({
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
}: UseChatOverlayHandlersOptions) {
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
        title: `Timeout ${target}`,
        actions: TIMEOUT_DURATION_OPTIONS.map(option => ({
          label: option.label,
          onPress: () => {
            runModAction({
              type: 'timeout',
              login: target,
              durationSeconds: option.seconds,
            });
          },
        })),
        cancelLabel: 'Cancel',
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
    ).then(() => toast.success('Copied to clipboard'));
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
      .then(() => toast.success('Message deleted'))
      .catch((error: unknown) => {
        logger.chat.warn('Failed to delete chat message', {
          error,
          channel_id: channelId,
        });
        toast.error('Moderation action failed');
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
      toast.success('Copied username'),
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
      title: `Warn ${target}`,
      actions: [
        {
          label: 'Spam',
          onPress: () => warnWithReason('Spam'),
        },
        {
          label: 'Harassment',
          onPress: () => warnWithReason('Harassment'),
        },
        {
          label: 'Breaking channel rules',
          onPress: () => warnWithReason('Breaking channel rules'),
        },
      ],
      cancelLabel: 'Cancel',
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
      'Block User',
      `Are you sure you want to block ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
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
                toast.error('Failed to block user');
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
  return {
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
  };
}
