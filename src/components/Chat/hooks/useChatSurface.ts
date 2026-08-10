import { useMemo, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

import { ReadyState } from '@app/hooks/ws/constants';
import {
  getUserStateRevision,
  subscribeUserState,
} from '@app/services/twitch-chat-service';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { ChatRenderPreferences } from '@app/store/preferenceStore';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { parseBadges } from '@app/utils/chat/parseBadges';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type { ChatListRef } from '../components/ChatList';
import type { ChatOverlayLayerProps } from '../components/ChatOverlayLayer';
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
    inputShellRef,
  });

  /**
   * getUserState's identity is deliberately stable, so without the revision
   * subscription the compiler caches this read at its mount-time value -
   * before USERSTATE has even arrived - and canModerateChat never updates.
   * The revision is a dependency on purpose.
   */
  const userStateRevision = useSyncExternalStore(
    subscribeUserState,
    getUserStateRevision,
  );
  const canModerateChat = useMemo(() => {
    // Referenced so the memo recomputes when a new USERSTATE lands; the
    // value itself carries no meaning beyond "the ref changed".
    void userStateRevision;
    const currentUserState = getUserState();
    const parsedBadges = parseBadges(currentUserState['badges-raw']).badges;
    return (
      currentUserState.mod === '1' ||
      parsedBadges.broadcaster === '1' ||
      normaliseChatUsername(user?.login) === normaliseChatUsername(channelName)
    );
  }, [getUserState, userStateRevision, user?.login, channelName]);

  const {
    handlePinMessage,
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
    handleRefreshEmotesAndBadges,
    handleResumeScrollToBottom,
    handleSettingsReconnect,
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

  const {
    handleBadgeLongPress,
    handleEmotePress,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleUsernamePress,
  } = useChatOverlayActions(channelId);

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

  const { getItemType, keyExtractor, messageListExtraData, renderItem } =
    useChatRowRenderer({
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

  const overlayProps: ChatOverlayLayerProps = {
    canModerateChat,
    channelId,
    channelName,
    currentUserId: user?.id,
    hiddenUsers,
    highlightedUsers,
    hidePhraseFromView,
    hideUserFromView,
    onAppendMention: appendMentionToComposer,
    onClearChatCache: handleClearChatCache,
    onClearImageCache: handleClearImageCache,
    onClearSevenTvCosmeticsCache: handleClearSevenTvCosmeticsCache,
    onInsertEmote: handleEmoteSelect,
    onInsertPhrase: insertPhraseToComposer,
    onPinMessage: handlePinMessage,
    onRefreshPinnedMessage: handleRefreshPinnedMessage,
    onReply: handleReply,
    onSettingsReconnect: handleSettingsReconnect,
    onSettingsRefetchEmotes: handleRefreshEmotesAndBadges,
    onUnpinPinnedMessage: handleUnpinPinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
    toggleHighlightedUser,
  };

  return {
    chatAssetPreferenceKey,
    getItemType,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleRefreshEmotesAndBadges,
    handleRefreshPinnedMessage,
    handleResumeScrollToBottom,
    handleUnpinPinnedMessage,
    keyExtractor,
    messageListExtraData,
    overlayProps,
    paneFlags,
    pinnedMessage,
    pinnedMessageBusy,
    renderItem,
  };
}
