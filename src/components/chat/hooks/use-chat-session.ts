import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { useNavigation } from 'expo-router';

import { useTwitchChannelPointsEventSub } from '@app/components/chat/hooks/use-twitch-channel-points-event-sub';
import { useSyntheticChatFlood } from '@app/dev/image-benchmark/use-synthetic-chat-flood.gate';
import { useLazyRef } from '@app/hooks/use-lazy-ref';
import { ReadyState } from '@app/hooks/ws/constants';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { notify7TVActivePresence } from '@app/store/chat/actions/seven-tv-channel-lifecycle';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import {
  type ChatRenderPreferences,
  usePreference,
} from '@app/store/preference-store';
import { videoLatencyDisplay$ } from '@app/store/stream/video-latency';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { textMentionsUser } from '@app/utils/chat/chat-usernames/text-mentions-user';
import { findCustomHighlight } from '@app/utils/chat/custom-highlights/find-custom-highlight';
import { replaceEmotesWithText } from '@app/utils/chat/replace-emotes-with-text';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/register-mention-chatter';

import type { ChatListRef } from '../components/chat-list';
import { resolveEffectiveChatDelayMs } from '../util/chat-delay/resolve-effective-chat-delay-ms';
import { triggerMentionHaptic } from '../util/mention-haptics';
import { useChatCosmetics } from './use-chat-cosmetics';
import { useChatEmoteLoader } from './use-chat-emote-loader';
import { useChatIrcHandlers } from './use-chat-irc-handlers';
import { useChatLifecycle } from './use-chat-lifecycle';
import { useChatMessageProcessing } from './use-chat-message-processing';
import { useChatMessages } from './use-chat-messages';
import type { ChatScrollAnchor } from './use-chat-scroll';
import { useRecentChatMessages } from './use-recent-chat-messages';
import { useSevenTvChatRuntime } from './use-seven-tv-chat-runtime';

interface UseChatSessionOptions {
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

  useChatCosmetics({
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
      const customHighlightRules = customHighlights ?? [];
      let shouldTriggerHaptic = false;

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
    show7tvBadges: preferences.show7tvBadges,
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
    joinChannel,
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
    navigation,
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

  const connected =
    twitchConnectionState === ReadyState.OPEN && isChatConnected();

  return {
    connected,
    emoteLoadStatus,
    forceFlush,
    handleViewableMessagesChange,
    isChatConnected,
    joinChannel,
    partChannel,
    processedMessageIdsRef,
    processMessageEmotes,
    refetchEmotes,
    reprocessAllMessages,
    sendMessage: sendMessageWithPresence,
    twitchConnectionState,
  };
}
