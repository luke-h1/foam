import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { useNavigation } from 'expo-router';

import { useTwitchChannelPointsEventSub } from '@app/components/chat/hooks/use-twitch-channel-points-event-sub';
import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { useSyntheticChatFlood } from '@app/dev/image-benchmark/hooks/use-synthetic-chat-flood.gate';
import { useLazyRef } from '@app/hooks/use-lazy-ref';
import { notify7TVActivePresence } from '@app/store/chat/actions/seven-tv-channel-lifecycle';
import {
  type ChatRenderPreferences,
  usePreference,
} from '@app/store/preference-store';
import { videoLatencyDisplay$ } from '@app/store/stream/video-latency';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { textMentionsUser } from '@app/utils/chat/chat-usernames/textMentionsUser';
import { findCustomHighlight } from '@app/utils/chat/custom-highlights/findCustomHighlight';
import { messageMentionsLogin } from '@app/utils/chat/derive-chat-body/scanChatBody';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/registerMentionChatter';

import type { ChatListRef } from '../components/ChatList';
import { resolveEffectiveChatDelayMs } from '../util/chat-delay/resolveEffectiveChatDelayMs';
import { triggerMentionHaptic } from '../util/mentionHaptics';
import { useChatEmoteLoader } from './use-chat-emote-loader';
import { useChatIrcHandlers } from './use-chat-irc-handlers';
import { useChatLifecycle } from './use-chat-lifecycle';
import { useChatMessageProcessing } from './use-chat-message-processing';
import { useChatMessages } from './use-chat-messages';
import type { ChatScrollAnchor } from './use-chat-scroll';
import { useEnsureSevenTvCosmetics } from './use-ensure-seven-tv-cosmetics';
import { useRecentChatMessages } from './use-recent-chat-messages';
import { useSevenTvChatRuntime } from './use-seven-tv-chat-runtime';
import { useTwitchChat } from './use-twitch-chat';

interface UseChatSessionOptions {
  messages$: ChatMessagesSource;
  channelId: string;
  channelName: string;
  cleanupScroll: () => void;
  listRef: RefObject<ChatListRef | null>;
  preferences: ChatRenderPreferences;
  scrollAnchor: ChatScrollAnchor;
  scrollToBottom: () => void;
  syntheticTransport: boolean;
  user?: UserInfoResponse;
}

export function useChatSession({
  messages$,
  channelId,
  channelName,
  cleanupScroll,
  listRef,
  preferences,
  scrollAnchor,
  scrollToBottom,
  syntheticTransport,
  user,
}: UseChatSessionOptions) {
  const navigation = useNavigation();
  const chatDelay = usePreference('chatDelay');
  const showRecentMessages = preferences.showRecentMessages;

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

  useEnsureSevenTvCosmetics(user?.id);

  const {
    status: emoteLoadStatus,
    sevenTvEmoteSetId,
    refetch: refetchEmotes,
    cancel: cancelEmoteLoad,
  } = useChatEmoteLoader({ channelId });

  const getChatDelayMs = useCallback(
    () => resolveEffectiveChatDelayMs(chatDelay, videoLatencyDisplay$.peek()),
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
    moderateChatMessageById,
    moderateChatMessagesByLogin,
    reconcileChatDelay,
    removeChatMessageById,
    removeChatMessagesByLogin,
    cleanup: cleanupMessages,
    forceFlush,
  } = useChatMessages({
    finalizeMessageForCommit: useCallback(
      (message: AnyChatMessageType) =>
        finalizeBufferedMessageRef.current(message),
      [],
    ),
    getChatDelayMs,
    scrollAnchor,
  });

  useEffect(() => {
    reconcileChatDelay();

    if (chatDelay !== 'auto') {
      return;
    }

    // In auto mode the effective delay tracks the measured video latency, so
    // measurement changes need the same reconcile as a preference change.
    return videoLatencyDisplay$.onChange(() => reconcileChatDelay());
  }, [chatDelay, reconcileChatDelay]);

  const chatMentionHaptics = usePreference('chatMentionHaptics');
  const customHighlights = preferences.customHighlights;

  const normalisedSelfForFeedback = normaliseChatUsername(
    user?.login ?? user?.display_name,
  );

  const handleNewMessage: typeof enqueueChatMessage = useCallback(
    (message, options) => {
      let shouldTriggerHaptic = false;

      if (chatMentionHaptics && options?.countUnread !== false) {
        // Deferred-parse live messages carry no mention tokens yet, so fall
        // back to scanning the raw text for an @self token.
        const mentionsSelf =
          normalisedSelfForFeedback.length > 0 &&
          (message.pendingEmoteParse
            ? textMentionsUser(
                replaceEmotesWithText(message.message),
                normalisedSelfForFeedback,
              )
            : messageMentionsLogin(message.message, normalisedSelfForFeedback));

        const matchesCustomHighlight =
          !mentionsSelf &&
          customHighlights.length > 0 &&
          Boolean(findCustomHighlight(message.message, customHighlights));

        shouldTriggerHaptic = mentionsSelf || matchesCustomHighlight;
      }

      if (shouldTriggerHaptic) {
        triggerMentionHaptic();
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
    handleNewMessage,
    messages$,
    scrollAnchor,
    show7TvEmotes: preferences.show7TvEmotes,
    showChatGifs: preferences.showChatGifs,
    userLogin: user?.login,
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
    onUserJoin,
    onUserPart,
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
    moderateChatMessageById,
    moderateChatMessagesByLogin,
    processMessageEmotes,
    removeChatMessageById,
    removeChatMessagesByLogin,
  });

  const {
    connectionState: twitchConnectionState,
    isConnected: isChatConnected,
    partChannel,
    reconnect,
    sendMessage,
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
    onUserJoin,
    onUserPart,
  });

  useSyntheticChatFlood({
    channelName,
    channelId,
    onMessage,
    enabled: syntheticTransport,
  });

  const { currentEmoteSetIdRef } = useChatLifecycle({
    // SAFETY: beforeRemove is valid at runtime; SDK 58's RootParamList event map omits it.
    navigation: navigation as {
      addListener: (event: 'beforeRemove', cb: () => void) => () => void;
    },
    channelId,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
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
  const sendMessageWithPresence: typeof sendMessage = useCallback(
    (...args) => {
      void notify7TVActivePresence(user?.id, channelId);
      return sendMessage(...args);
    },
    [channelId, sendMessage, user?.id],
  );

  useTwitchChannelPointsEventSub(syntheticTransport ? undefined : channelId);

  return {
    emoteLoadStatus,
    forceFlush,
    handleViewableMessagesChange,
    isChatConnected,
    processedMessageIdsRef,
    processMessageEmotes,
    reconnect,
    refetchEmotes,
    reprocessAllMessages,
    sendMessage: sendMessageWithPresence,
    twitchConnectionState,
  };
}
