import {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { useNavigation } from 'expo-router';

import { useSyntheticChatFlood } from '@app/dev/imageBenchmark/useSyntheticChatFlood.gate';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useTwitchChannelPointsEventSub } from '@app/hooks/useTwitchChannelPointsEventSub';
import { ReadyState } from '@app/hooks/ws/constants';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { notify7TVActivePresence } from '@app/store/chat/actions/channelLoad';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  type ChatRenderPreferences,
  usePreference,
} from '@app/store/preferenceStore';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { findCustomHighlight } from '@app/utils/chat/customHighlights';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin';

import type { ChatListRef } from '../components/ChatList';
import { resolveEffectiveChatDelayMs } from '../util/chatDelay';
import { normaliseChatUsername, textMentionsUser } from '../util/chatUsernames';
import { triggerMentionHaptic } from '../util/mentionHaptics';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { useChatCosmetics } from './useChatCosmetics';
import { useChatEmoteLoader } from './useChatEmoteLoader';
import { useChatIrcHandlers } from './useChatIrcHandlers';
import { useChatLifecycle } from './useChatLifecycle';
import { useChatMessageProcessing } from './useChatMessageProcessing';
import { useChatMessages } from './useChatMessages';
import { useRecentChatMessages } from './useRecentChatMessages';
import { useSevenTvChatRuntime } from './useSevenTvChatRuntime';

interface UseChatSessionOptions {
  channelId: string;
  channelName: string;
  cleanupScroll: () => void;
  hydratedVisibleAssetKeysRef: MutableRefObject<Set<string>>;
  isAtBottomRef: MutableRefObject<boolean>;
  isScrollingToBottomRef: MutableRefObject<boolean>;
  isUserActivelyScrolling: () => boolean;
  listRef: RefObject<ChatListRef | null>;
  maintainBottomAfterContentChange: () => void;
  pendingVisibleMessagesRef: MutableRefObject<AnyChatMessageType[]>;
  preferences: ChatRenderPreferences;
  scrollToBottom: () => void;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  syntheticTransport: boolean;
  user?: UserInfoResponse;
  visibleAssetHydrationTimerRef: MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  visibleCosmeticUsersRef: MutableRefObject<Set<string>>;
  visiblePersonalEmoteUsersRef: MutableRefObject<Set<string>>;
}

export function useChatSession({
  channelId,
  channelName,
  cleanupScroll,
  hydratedVisibleAssetKeysRef,
  isAtBottomRef,
  isScrollingToBottomRef,
  isUserActivelyScrolling,
  listRef,
  maintainBottomAfterContentChange,
  pendingVisibleMessagesRef,
  preferences,
  scrollToBottom,
  setUnreadCount,
  syntheticTransport,
  user,
  visibleAssetHydrationTimerRef,
  visibleCosmeticUsersRef,
  visiblePersonalEmoteUsersRef,
}: UseChatSessionOptions) {
  const navigation = useNavigation();
  const chatDelay = usePreference('chatDelay');
  const showRecentMessages = preferences.showRecentMessages !== false;
  const messages$ = chatStore$.messages;

  const processedMessageIdsRef = useLazyRef(() => new Set<string>());
  const isLoadingRecentMessagesRef = useRef(false);
  const isChatMountedRef = useRef(true);

  useEffect(() => {
    registerMentionChatter({ login: channelName });
    registerMentionChatter({
      login: user?.login,
      userId: user?.id,
    });
  }, [channelName, user?.id, user?.login]);

  const { fetchedCosmeticsUsersRef, fetchUserCosmetics } = useChatCosmetics({
    userId: user?.id,
  });

  const {
    status: emoteLoadStatus,
    sevenTvEmoteSetId,
    refetch: refetchEmotes,
    cancel: cancelEmoteLoad,
  } = useChatEmoteLoader({
    channelId,
    enabled: true,
  });

  const getChatDelayMs = useCallback(
    () => resolveEffectiveChatDelayMs(chatDelay),
    [chatDelay],
  );

  // Filled in below once useChatMessageProcessing exists; useChatMessages
  // mounts first and needs the finalizer via a ref.
  const finalizeBufferedMessageRef = useRef<
    (message: AnyChatMessageType) => AnyChatMessageType
  >(message => message);

  const {
    handleNewMessage: enqueueChatMessage,
    clearLocalMessages,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    reconcileChatDelay,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
    cleanup: cleanupMessages,
    forceFlush,
  } = useChatMessages({
    finalizeMessageForCommit: useCallback(
      (message: AnyChatMessageType) =>
        finalizeBufferedMessageRef.current(message),
      [],
    ),
    getChatDelayMs,
    isAtBottomRef,
    isScrollingToBottomRef,
    isUserActivelyScrolling,
    onBottomContentChange: maintainBottomAfterContentChange,
    onUnreadIncrement: useCallback(
      (count: number) => setUnreadCount(prev => prev + count),
      [setUnreadCount],
    ),
  });

  useEffect(() => {
    reconcileChatDelay();
  }, [chatDelay, reconcileChatDelay]);

  const chatMentionHaptics = usePreference('chatMentionHaptics');
  const customHighlights = preferences.customHighlights;
  const normalisedSelfForFeedback = normaliseChatUsername(
    user?.login ?? user?.display_name,
  );

  const handleNewMessage: typeof enqueueChatMessage = useCallback(
    (message, options) => {
      const customHighlightRules = customHighlights ?? [];
      if (chatMentionHaptics && options?.countUnread !== false) {
        // Deferred-parse live messages carry no mention parts yet, so fall
        // back to scanning the raw text for an @self token.
        const mentionsSelf =
          normalisedSelfForFeedback.length > 0 &&
          (message.pendingEmoteParse
            ? textMentionsUser(
                replaceEmotesWithText(message.message),
                normalisedSelfForFeedback,
              )
            : message.message.some(
                part =>
                  part.type === 'mention' &&
                  normaliseChatUsername(part.content.replace(/^@/, '')) ===
                    normalisedSelfForFeedback,
              ));
        const matchesCustomHighlight =
          !mentionsSelf &&
          customHighlightRules.length > 0 &&
          Boolean(findCustomHighlight(message.message, customHighlightRules));

        if (mentionsSelf || matchesCustomHighlight) {
          triggerMentionHaptic();
        }
      }

      enqueueChatMessage(message, options);
    },
    [
      chatMentionHaptics,
      customHighlights,
      enqueueChatMessage,
      normalisedSelfForFeedback,
    ],
  );

  const {
    enqueueLiveChatMessage,
    finalizeBufferedMessage,
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  } = useChatMessageProcessing({
    channelId,
    fetchUserCosmetics,
    handleNewMessage,
    hydratedVisibleAssetKeysRef,
    isAtBottomRef,
    maintainBottomAfterContentChange,
    messages$,
    pendingVisibleMessagesRef,
    show7TvEmotes: preferences.show7TvEmotes,
    show7tvBadges: preferences.show7tvBadges,
    userLogin: user?.login,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  });

  useLayoutEffect(() => {
    finalizeBufferedMessageRef.current = finalizeBufferedMessage;
  });

  const {
    handleRecentIrcMessage,
    onClearChat,
    onClearMessage,
    onJoin,
    onMessage,
    onNotice,
    onPart,
    onReconnect,
    onRoomState,
    onUserNotice,
  } = useChatIrcHandlers({
    channelId,
    channelName,
    clearLocalMessages,
    enqueueLiveChatMessage,
    handleNewMessage,
    isMountedRef: isChatMountedRef,
    isLoadingRecentMessagesRef,
    listRef,
    messages$,
    moderateBufferedMessageById,
    moderateBufferedMessagesByLogin,
    processMessageEmotes,
    removeBufferedMessageById,
    removeBufferedMessagesByLogin,
  });

  const {
    connectionState: twitchConnectionState,
    isConnected: isChatConnected,
    partChannel,
    joinChannel,
    sendMessage,
    sendChatCommand,
    getUserState,
  } = useTwitchChat({
    // Perf mode: no channel means the socket never connects and the synthetic
    // flood is the only thing feeding onMessage.
    channel: syntheticTransport ? undefined : channelName,
    onMessage,
    onNotice,
    onUserNotice,
    onClearChat,
    onClearMessage,
    onReconnect,
    onRoomState,
    onJoin,
    onPart,
  });

  useSyntheticChatFlood({
    channelName,
    channelId,
    onMessage,
    enabled: syntheticTransport,
  });

  const { currentEmoteSetIdRef } = useChatLifecycle({
    navigation,
    channelId,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    fetchedCosmeticsUsersRef,
    isMountedRef: isChatMountedRef,
    processedMessageIdsRef,
  });

  useRecentChatMessages({
    channelId,
    channelName,
    forceFlush,
    processRecentIrcLine: handleRecentIrcMessage,
    isLoadingRecentMessagesRef,
    scrollChatToEnd: scrollToBottom,
    showRecentMessages: syntheticTransport ? false : showRecentMessages,
  });

  useSevenTvChatRuntime({
    channelId,
    channelName,
    currentEmoteSetIdRef,
    emoteLoadStatus,
    handleNewMessage,
    sevenTvEmoteSetId,
  });

  // Broadcasting presence when the user actually chats is how 7TV pushes this
  // user's cosmetics to everyone else in the channel (rate limited inside).
  const sendMessageWithPresence: typeof sendMessage = (...args) => {
    void notify7TVActivePresence(user?.id, channelId);
    return sendMessage(...args);
  };

  useTwitchChannelPointsEventSub(syntheticTransport ? undefined : channelId);

  const connected =
    twitchConnectionState === ReadyState.OPEN && isChatConnected();

  return {
    connected,
    emoteLoadStatus,
    fetchUserCosmetics,
    forceFlush,
    getUserState,
    handleViewableMessagesChange,
    isChatConnected,
    joinChannel,
    partChannel,
    processedMessageIdsRef,
    processMessageEmotes,
    refetchEmotes,
    reprocessAllMessages,
    sendChatCommand,
    sendMessage: sendMessageWithPresence,
    twitchConnectionState,
  };
}
