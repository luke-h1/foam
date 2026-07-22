import { useCallback, useMemo } from 'react';
import { Alert, useColorScheme } from 'react-native';

import { useObservable, useSelector } from '@legendapp/state/react';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import i18next from '@app/i18n/i18next';
import { queryClient } from '@app/lib/react-query/query-client';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { showActionMenu } from '@app/store/overlays/showActionMenu';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import type { ModCommand } from '../util/modCommands';
import { runModCommand } from '../util/runModCommand';
import {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './ChatMessage/RichChatMessage.types';
import { ChatOverlayLayer } from './ChatOverlayLayer';
import type { EmotePickerItem } from './EmoteSheet/EmoteSheet';

export interface ChatOverlayOpeners {
  openBadge: (badge: BadgePressData) => void;
  openChattersSheet: () => void;
  openEmotePreview: (emote: EmotePressData) => void;
  openEmoteSheet: () => void;
  openMessageActions: (message: MessageActionData<'usernotice'>) => void;
  openSavedPhrasesSheet: () => void;
  openSettingsSheet: () => void;
  openUserActions: (user: UsernamePressData) => void;
}

interface UseChatOverlaysParams {
  appendMentionToComposer: (username: string) => void;
  canModerateChat: boolean;
  channelId: string;
  currentUserId?: string;
  handleReply: (message: ChatMessageType<'usernotice'>) => void;
  hiddenUsers: string[];
  highlightedUsers: string[];
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  insertPhraseToComposer: (text: string) => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onClearSevenTvCosmeticsCache: () => void;
  onInsertEmote: (item: EmotePickerItem) => void;
  onPinMessage: (message: MessageActionData<'usernotice'>) => void;
  onRefreshPinnedMessage: (messageId: string) => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onUnpinPinnedMessage: () => void;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  toggleHighlightedUser: (username?: string) => void;
}

interface ChatOverlayState {
  channelId: string;
  isChattersSheetMounted: boolean;
  isEmoteSheetMounted: boolean;
  isSavedPhrasesSheetMounted: boolean;
  isSettingsSheetMounted: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
}

function createEmptyOverlayState(channelId: string): ChatOverlayState {
  return {
    channelId,
    isChattersSheetMounted: false,
    isEmoteSheetMounted: false,
    isSavedPhrasesSheetMounted: false,
    isSettingsSheetMounted: false,
    selectedBadge: null,
    selectedEmote: null,
    selectedMessage: null,
    selectedUser: null,
  };
}

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

export function useChatOverlays({
  appendMentionToComposer,
  canModerateChat,
  channelId,
  currentUserId,
  handleReply,
  hiddenUsers,
  highlightedUsers,
  hidePhraseFromView,
  hideUserFromView,
  insertPhraseToComposer,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onInsertEmote,
  onPinMessage,
  onRefreshPinnedMessage,
  onSettingsReconnect,
  onSettingsRefetchEmotes,
  onUnpinPinnedMessage,
  pinnedMessageBusy,
  pinnedMessageId,
  toggleHighlightedUser,
}: UseChatOverlaysParams): {
  openers: ChatOverlayOpeners;
  overlaysElement: React.ReactElement;
} {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const overlay$ = useObservable(createEmptyOverlayState(channelId));
  const overlay = useSelector(overlay$);
  const {
    isChattersSheetMounted,
    isEmoteSheetMounted,
    isSavedPhrasesSheetMounted,
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

  const openBadge = useCallback(
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

  const openChattersSheet = useCallback(() => {
    replaceOverlay({ isChattersSheetMounted: true });
  }, [replaceOverlay]);

  const openSavedPhrasesSheet = useCallback(() => {
    replaceOverlay({ isSavedPhrasesSheetMounted: true });
  }, [replaceOverlay]);

  const openUserActions = useCallback(
    (user: UsernamePressData) => {
      replaceOverlay({ selectedUser: user });
    },
    [replaceOverlay],
  );

  const selectedMessageId = selectedMessage?.messageData.message_id?.trim();
  const canModerateSelectedMessageUser = Boolean(
    resolveModTarget(selectedMessage),
  );
  const canDeleteSelectedMessage = Boolean(selectedMessageId);
  const canPinSelectedMessage = Boolean(
    !pinnedMessageBusy && selectedMessageId,
  );
  const canModerateSelectedUser = Boolean(resolveModTarget(selectedUser));

  const handleEmoteSheetDidDismiss = useCallback(() => {
    patchOverlay({ isEmoteSheetMounted: false });
  }, [patchOverlay]);

  const handleSettingsSheetDidDismiss = useCallback(() => {
    patchOverlay({ isSettingsSheetMounted: false });
  }, [patchOverlay]);

  const handleChattersSheetDidDismiss = useCallback(() => {
    patchOverlay({ isChattersSheetMounted: false });
  }, [patchOverlay]);

  const handleSavedPhrasesSheetDidDismiss = useCallback(() => {
    patchOverlay({ isSavedPhrasesSheetMounted: false });
  }, [patchOverlay]);

  const handleSelectSavedPhrase = useCallback(
    (text: string) => {
      insertPhraseToComposer(text);
    },
    [insertPhraseToComposer],
  );

  const handleSelectChatter = useCallback(
    (chatter: UsernamePressData) => {
      replaceOverlay({ selectedUser: chatter });
    },
    [replaceOverlay],
  );

  const handleActionSheetReply = useCallback(() => {
    if (!selectedMessage) {
      return;
    }
    handleReply(selectedMessage.messageData);
  }, [handleReply, selectedMessage]);

  const handleActionSheetCopy = useCallback(() => {
    if (!selectedMessage) {
      return;
    }
    const messageText = replaceEmotesWithText(selectedMessage.message);
    void Clipboard.setStringAsync(messageText).then(() =>
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
    if (!selectedMessage) {
      return;
    }

    hidePhraseFromView(replaceEmotesWithText(selectedMessage.message));
  }, [hidePhraseFromView, selectedMessage]);

  /**
   * Twitch dropped IRC slash commands in 2023; Helix 403 = not a mod.
   */
  const runModAction = useCallback(
    (command: ModCommand) => {
      runModCommand(command, channelId, currentUserId);
    },
    [channelId, currentUserId],
  );

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
    if (!selectedMessage) {
      return;
    }

    onPinMessage(selectedMessage);
  }, [onPinMessage, selectedMessage]);

  const handleActionSheetUpdatePinnedMessage = useCallback(() => {
    const messageId = selectedMessage?.messageData.message_id?.trim();
    if (!messageId) {
      return;
    }

    onRefreshPinnedMessage(messageId);
  }, [onRefreshPinnedMessage, selectedMessage?.messageData.message_id]);

  const handleActionSheetUnpinPinnedMessage = useCallback(() => {
    onUnpinPinnedMessage();
  }, [onUnpinPinnedMessage]);

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

  const handleActionSheetTimeoutUser = useCallback(() => {
    promptTimeoutDuration(selectedMessage);
  }, [promptTimeoutDuration, selectedMessage]);

  const handleActionSheetBanUser = useCallback(() => {
    banSelection(selectedMessage);
  }, [banSelection, selectedMessage]);

  const handleMentionSelectedUser = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    appendMentionToComposer(selectedUser.username);
  }, [appendMentionToComposer, selectedUser]);

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
    if (!target) {
      return;
    }

    openLinkInBrowser(`https://www.twitch.tv/${target}/report`, scheme);
  }, [selectedUser, scheme]);

  const selectedUserId = selectedUser?.userId?.trim();
  const canBlockSelectedUser = Boolean(
    selectedUserId &&
    /^\d+$/.test(selectedUserId) &&
    selectedUserId !== currentUserId,
  );

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
    },
    [onInsertEmote],
  );

  const mountedSheets = useMemo(
    () => ({
      chatters: isChattersSheetMounted,
      emote: isEmoteSheetMounted,
      savedPhrases: isSavedPhrasesSheetMounted,
      settings: isSettingsSheetMounted,
    }),
    [
      isChattersSheetMounted,
      isEmoteSheetMounted,
      isSavedPhrasesSheetMounted,
      isSettingsSheetMounted,
    ],
  );

  const selectedMessageActions = useMemo(
    () => ({
      canDelete: canDeleteSelectedMessage,
      canModerateUser: canModerateSelectedMessageUser,
      canPin: canPinSelectedMessage,
    }),
    [
      canDeleteSelectedMessage,
      canModerateSelectedMessageUser,
      canPinSelectedMessage,
    ],
  );

  const selectedUserActions = useMemo(
    () => ({
      canBlock: canBlockSelectedUser,
      canModerate: canModerateSelectedUser,
    }),
    [canBlockSelectedUser, canModerateSelectedUser],
  );

  const overlaysElement = (
    <ChatOverlayLayer
      canModerateChat={canModerateChat}
      highlightedUsers={highlightedUsers}
      hiddenUsers={hiddenUsers}
      mountedSheets={mountedSheets}
      selectedMessageActions={selectedMessageActions}
      selectedUserActions={selectedUserActions}
      onActionSheetBanUser={handleActionSheetBanUser}
      onActionSheetCopy={handleActionSheetCopy}
      onActionSheetDeleteMessage={handleActionSheetDeleteMessage}
      onActionSheetHidePhrase={handleActionSheetHidePhrase}
      onActionSheetHideUser={handleActionSheetHideUser}
      onActionSheetHighlightUser={handleActionSheetHighlightUser}
      onActionSheetPinMessage={handleActionSheetPinMessage}
      onActionSheetReply={handleActionSheetReply}
      onActionSheetUpdatePinnedMessage={handleActionSheetUpdatePinnedMessage}
      onActionSheetUnpinPinnedMessage={handleActionSheetUnpinPinnedMessage}
      onActionSheetTimeoutUser={handleActionSheetTimeoutUser}
      onBanSelectedUser={handleBanSelectedUser}
      onWarnSelectedUser={handleWarnSelectedUser}
      onBlockSelectedUser={handleBlockSelectedUser}
      onReportSelectedUser={handleReportSelectedUser}
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
      selectedBadge={selectedBadge}
      selectedEmote={selectedEmote}
      selectedMessage={selectedMessage}
      selectedUser={selectedUser}
      onChattersSheetDidDismiss={handleChattersSheetDidDismiss}
      onOpenChatters={openChattersSheet}
      onOpenSavedPhrases={openSavedPhrasesSheet}
      onSavedPhrasesSheetDidDismiss={handleSavedPhrasesSheetDidDismiss}
      onSelectChatter={handleSelectChatter}
      onSelectSavedPhrase={handleSelectSavedPhrase}
      pinnedMessageBusy={pinnedMessageBusy}
      pinnedMessageId={pinnedMessageId}
    />
  );

  const openers = useMemo(
    () => ({
      openBadge,
      openChattersSheet,
      openEmotePreview,
      openEmoteSheet,
      openMessageActions,
      openSavedPhrasesSheet,
      openSettingsSheet,
      openUserActions,
    }),
    [
      openBadge,
      openChattersSheet,
      openEmotePreview,
      openEmoteSheet,
      openMessageActions,
      openSavedPhrasesSheet,
      openSettingsSheet,
      openUserActions,
    ],
  );

  return {
    openers,
    overlaysElement,
  };
}
