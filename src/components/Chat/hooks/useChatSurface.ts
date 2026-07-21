import { useMemo } from 'react';
import type { RefObject } from 'react';

import { ReadyState } from '@app/hooks/ws/constants';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { ChatRenderPreferences } from '@app/store/preferences/selectors';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { parseBadges } from '@app/utils/chat/parseBadges';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type { ChatListRef } from '../components/ChatList';
import { useChatOverlays } from '../components/useChatOverlays';
import { normaliseChatUsername } from '../util/chatUsernames/normaliseChatUsername';
import {
  useChatComposerActions,
  useChatOverlayActions,
} from './useChatInteractionHandlers';
import { useChatRowRenderer } from './useChatRowRenderer';
import { useChatSettingsActions } from './useChatSettingsActions';
import { usePinnedChatMessage } from './usePinnedChatMessage';

interface UseChatSurfaceOptions {
  channelId: string;
  channelName: string;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: {
      retryMissingBadge?: boolean;
    },
  ) => Promise<void>;
  forceFlush: () => void;
  getUserState: () => Record<string, string>;
  hiddenUsers: string[];
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  inputShellRef: RefObject<ChatInputShellHandle | null>;
  joinChannel: (channel: string) => void;
  listRef: RefObject<ChatListRef | null>;
  partChannel: (channel: string) => void;
  preferences: ChatRenderPreferences;
  refetchEmotes: () => Promise<void>;
  reprocessAllMessages: () => void;
  scrollToBottom: () => void;
  setHighlightedReplyTargetMessageId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  shouldMaintainScrollAtEnd: boolean;
  showOnlyMentions: boolean;
  toggleHighlightedUser: (username?: string) => void;
  twitchConnectionState: ReadyState;
  user?: UserInfoResponse;
}

export function useChatSurface({
  channelId,
  channelName,
  fetchUserCosmetics,
  forceFlush,
  getUserState,
  hiddenUsers,
  hidePhraseFromView,
  hideUserFromView,
  highlightedReplyTargetTimeoutRef,
  highlightedUsers,
  inputShellRef,
  joinChannel,
  listRef,
  partChannel,
  preferences,
  refetchEmotes,
  reprocessAllMessages,
  scrollToBottom,
  setHighlightedReplyTargetMessageId,
  shouldMaintainScrollAtEnd,
  showOnlyMentions,
  toggleHighlightedUser,
  twitchConnectionState,
  user,
}: UseChatSurfaceOptions) {
  const messages$ = chatStore$.messages;

  const chatAssetPreferenceKey = useMemo(
    () =>
      [
        preferences.emojiStyle,
        preferences.show7TvEmotes,
        preferences.showBttvEmotes,
        preferences.showFFzEmotes,
        preferences.showTwitchEmotes,
        preferences.show7tvBadges,
        preferences.showBttvBadges,
        preferences.showFFzBadges,
        preferences.showTwitchBadges,
        preferences.showChatterinoEmotes,
      ].join('|'),
    [
      preferences.emojiStyle,
      preferences.show7TvEmotes,
      preferences.showBttvEmotes,
      preferences.showFFzEmotes,
      preferences.showTwitchEmotes,
      preferences.show7tvBadges,
      preferences.showBttvBadges,
      preferences.showFFzBadges,
      preferences.showTwitchBadges,
      preferences.showChatterinoEmotes,
    ],
  );

  const {
    appendMentionToComposer,
    handleEmoteSelect,
    handleReply,
    insertPhraseToComposer,
  } = useChatComposerActions({
    fetchUserCosmetics,
    inputShellRef,
  });

  const currentUserState = getUserState();
  const parsedBadges = parseBadges(currentUserState['badges-raw']).badges;
  const canModerateChat =
    currentUserState.mod === '1' ||
    parsedBadges.broadcaster === '1' ||
    normaliseChatUsername(user?.login) === normaliseChatUsername(channelName);

  const {
    handlePinMessage,
    handlePinnedMessageChanged,
    handleRefreshPinnedMessage,
    handleUnpinPinnedMessage,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
  } = usePinnedChatMessage({
    canModerateChat,
    channelId,
    moderatorId: user?.id,
  });

  const {
    handleClearChatCache,
    handleClearImageCache,
    handleClearSevenTvCosmeticsCache,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleRefreshCommand,
  } = useChatSettingsActions({
    channelId,
    channelName,
    forceFlush,
    joinChannel,
    partChannel,
    refetchEmotes,
    reprocessAllMessages,
    scrollToBottom,
  });

  const { openers, overlaysElement } = useChatOverlays({
    appendMentionToComposer,
    canModerateChat,
    channelId,
    currentUserId: user?.id,
    handleReply,
    hiddenUsers,
    highlightedUsers,
    hidePhraseFromView,
    hideUserFromView,
    insertPhraseToComposer,
    onClearChatCache: handleClearChatCache,
    onClearImageCache: handleClearImageCache,
    onClearSevenTvCosmeticsCache: handleClearSevenTvCosmeticsCache,
    onInsertEmote: handleEmoteSelect,
    onPinMessage: handlePinMessage,
    onRefreshPinnedMessage: handleRefreshPinnedMessage,
    onSettingsReconnect: handleSettingsReconnect,
    onSettingsRefetchEmotes: handleSettingsRefetchEmotes,
    onUnpinPinnedMessage: handleUnpinPinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    toggleHighlightedUser,
  });

  const {
    handleBadgeLongPress,
    handleEmotePress,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleUsernamePress,
  } = useChatOverlayActions(openers);

  const paneFlags = useMemo(
    () => ({
      canModerateChat,
      connected: twitchConnectionState === ReadyState.OPEN,
      showOnlyMentions,
      shouldMaintainScrollAtEnd,
    }),
    [
      canModerateChat,
      shouldMaintainScrollAtEnd,
      showOnlyMentions,
      twitchConnectionState,
    ],
  );

  const {
    getItemType,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    renderItem,
  } = useChatRowRenderer({
    channelId,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    listRef,
    messages$,
    onBadgePress: handleBadgeLongPress,
    onEmotePress: handleEmotePress,
    onMessageLongPress: handleMessageLongPress,
    onUsernamePress: handleUsernamePress,
    preferences,
    setHighlightedReplyTargetMessageId,
    user,
  });

  return {
    appendMentionToComposer,
    canModerateChat,
    chatAssetPreferenceKey,
    getItemType,
    handleClearChatCache,
    handleClearSevenTvCosmeticsCache,
    handleClearImageCache,
    handleEmoteSelect,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handlePinMessage,
    handlePinnedMessageChanged,
    handleRefreshCommand,
    handleRefreshPinnedMessage,
    handleReply,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
    handleSettingsRefetchEmotes,
    handleUnpinPinnedMessage,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    overlaysElement,
    paneFlags,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    renderItem,
  };
}
