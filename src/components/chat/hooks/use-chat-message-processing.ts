import { useCallback, useEffect, useRef } from 'react';

import type { ChatScrollAnchor } from '@app/components/chat/hooks/use-chat-scroll';
import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { hydrateVisibleSevenTvAssets } from '@app/components/chat/util/hydrate-visible-seven-tv-assets/hydrateVisibleSevenTvAssets';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import {
  enrichMessageSet,
  hasEnrichmentEmoteSources,
  refreshSharedChatBadges,
  resolveVisibleMessageUpdate,
} from '@app/store/chat/actions/message-enrichment';
import { updateMessages } from '@app/store/chat/actions/messages';
import {
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import { resolveMessageEmoteTokens } from '@app/store/chat/actions/resolveMessageEmoteTokens';
import { getCachedSharedChatBadgeContext } from '@app/store/chat/actions/shared-chat-badges/getCachedSharedChatBadgeContext';
import { getMessageBadges } from '@app/store/chat/actions/shared-chat-badges/getMessageBadges';
import { fetchUserCosmetics } from '@app/store/chat/actions/user-cosmetics-fetch';
import {
  invalidateVisibleAssetHydrationPass,
  scheduleVisibleAssetHydrationPass,
  visibleAssetHydration,
} from '@app/store/chat/actions/visible-asset-hydration';
import { usePersonalEmotesVersion } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/createUserStateFromTags';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

interface ResolvedMessageParts {
  badges: AnyChatMessageType['badges'];
  message: AnyChatMessageType['message'];
}

interface UseChatMessageProcessingOptions {
  channelId: string;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  messages$: ChatMessagesSource;
  scrollAnchor: ChatScrollAnchor;
  show7TvEmotes: boolean;
  showChatGifs: boolean;
  userLogin?: string | null;
}

export function useChatMessageProcessing({
  channelId,
  handleNewMessage,
  messages$,
  scrollAnchor,
  show7TvEmotes,
  showChatGifs,
  userLogin,
}: UseChatMessageProcessingOptions) {
  const resolveMessageParts = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
    ): ResolvedMessageParts | null => {
      const emoteData = getCurrentEmoteData(channelId);
      const hasGifs = showChatGifs && Boolean(userstate.gifs?.trim());

      if (!hasEnrichmentEmoteSources(emoteData) && !hasGifs) {
        return null;
      }

      try {
        const message = resolveMessageEmoteTokens({
          channelId,
          emoteData,
          show7TvEmotes,
          showChatGifs,
          text: text.trimEnd(),
          userId,
          userLogin,
          userstate,
        });

        const cachedSharedBadgeContext =
          getCachedSharedChatBadgeContext(userstate);

        const badges = getMessageBadges({
          userstate,
          emoteData,
          sourceBadge: cachedSharedBadgeContext?.sourceBadge,
          sourceChannelBadges: cachedSharedBadgeContext?.sourceChannelBadges,
        });

        if (cachedSharedBadgeContext?.isComplete === false) {
          refreshSharedChatBadges({
            emoteData,
            messageId: baseMessage.message_id,
            messageNonce: baseMessage.message_nonce,
            userstate,
          });
        }

        return { message, badges };
      } catch (error) {
        logger.chat.error('Error processing emotes:', error);
        return null;
      }
    },
    [channelId, show7TvEmotes, userLogin, showChatGifs],
  );

  const processMessageEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
      countUnread = true,
    ) => {
      const parts = resolveMessageParts(text, userstate, baseMessage, userId);

      handleNewMessage(
        parts
          ? { ...baseMessage, message: parts.message, badges: parts.badges }
          : baseMessage,
        { countUnread },
      );
    },
    [resolveMessageParts, handleNewMessage],
  );

  const finalizeBufferedMessage = useCallback(
    (message: AnyChatMessageType): AnyChatMessageType => {
      if (!message.pendingEmoteParse) {
        return message;
      }

      const parts = resolveMessageParts(
        replaceEmotesWithText(message.message).trimEnd(),
        message.userstate,
        message,
        message.userstate['user-id'],
      );

      if (!parts) {
        return { ...message, pendingEmoteParse: undefined };
      }

      return {
        ...message,
        message: parts.message,
        badges: parts.badges,
        pendingEmoteParse: undefined,
      };
    },
    [resolveMessageParts],
  );

  const reprocessVisibleMessageFromCache = useCallback(
    (message: AnyChatMessageType) =>
      resolveVisibleMessageUpdate({
        channelId,
        message,
        show7TvEmotes,
        showChatGifs,
        userLogin,
      }),
    [channelId, show7TvEmotes, userLogin, showChatGifs],
  );

  const latestVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);
  const cancelEnrichMessageSetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      invalidateVisibleAssetHydrationPass();
      cancelEnrichMessageSetRef.current?.();
      cancelEnrichMessageSetRef.current = null;
    };
  }, [channelId]);

  const runVisibleAssetHydrationPass = useCallback(
    (epoch: number) => {
      const messages = visibleAssetHydration.pendingMessages;
      visibleAssetHydration.pendingMessages = [];
      const shouldMaintainBottom = scrollAnchor.isAtBottomRef.current;

      return hydrateVisibleSevenTvAssets({
        channelId,
        messages,
        hydratedMessageKeys: visibleAssetHydration.hydratedMessageKeys,
        personalEmoteUsers: visibleAssetHydration.personalEmoteUsers,
        cosmeticUsers: visibleAssetHydration.cosmeticUsers,
        getUserPersonalEmotes,
        fetchUserPersonalEmotes,
        getUserBadge: twitchUserId => getUserBadge(twitchUserId) ?? null,
        fetchUserCosmetics,
        hydratePersonalEmotes: show7TvEmotes,
        hydrateCosmetics: true,
        reprocessMessage: reprocessVisibleMessageFromCache,
        publishMessageUpdates: updateMessages,
        shouldContinue: () => visibleAssetHydration.epoch === epoch,
      }).then(didReprocessMessages => {
        if (
          didReprocessMessages &&
          shouldMaintainBottom &&
          scrollAnchor.isAtBottomRef.current
        ) {
          scrollAnchor.maintainBottomAfterContentChange();
        }
      });
    },
    [channelId, scrollAnchor, reprocessVisibleMessageFromCache, show7TvEmotes],
  );

  const handleViewableMessagesChange = useCallback(
    (visibleMessages: AnyChatMessageType[]) => {
      latestVisibleMessagesRef.current = visibleMessages;
      visibleAssetHydration.pendingMessages = visibleMessages;
      scheduleVisibleAssetHydrationPass(runVisibleAssetHydrationPass);
    },
    [runVisibleAssetHydrationPass],
  );

  const personalEmotesVersion = usePersonalEmotesVersion();
  const lastPersonalEmotesVersionRef = useRef(personalEmotesVersion);

  useEffect(() => {
    if (lastPersonalEmotesVersionRef.current === personalEmotesVersion) {
      return;
    }

    lastPersonalEmotesVersionRef.current = personalEmotesVersion;
    visibleAssetHydration.hydratedMessageKeys.clear();
    visibleAssetHydration.pendingMessages = latestVisibleMessagesRef.current;
    scheduleVisibleAssetHydrationPass(runVisibleAssetHydrationPass);
  }, [personalEmotesVersion, runVisibleAssetHydrationPass]);

  const reprocessAllMessages = useCallback(() => {
    const emoteData = getCurrentEmoteData(channelId);

    cancelEnrichMessageSetRef.current?.();

    cancelEnrichMessageSetRef.current = enrichMessageSet({
      channelId,
      emoteData,
      messages: messages$.peek(),
      show7TvEmotes,
      showChatGifs,
      userLogin,
    });
  }, [channelId, messages$, show7TvEmotes, showChatGifs, userLogin]);

  return {
    finalizeBufferedMessage,
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  };
}
