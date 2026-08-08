import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import {
  fetchUserPersonalEmotes,
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import {
  enrichMessageSet,
  enrichVisibleMessage,
  hasEnrichmentEmoteSources,
  refreshSharedChatBadges,
} from '@app/store/chat/actions/messageEnrichment';
import {
  clearVisibleAssetHydrationTimer,
  visibleAssetHydration,
} from '@app/store/chat/actions/visibleAssetHydration';
import { usePersonalEmotesVersion } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateFromTags } from '@app/utils/chat/messageHandlers/createUserStateFromTags';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import { hydrateVisibleSevenTvAssets } from '../util/hydrateVisibleSevenTvAssets/hydrateVisibleSevenTvAssets';
import { resolveMessageEmoteParts } from '../util/resolveMessageEmoteParts';
import { getCachedSharedChatBadgeContext } from '../util/sharedChatBadges/getCachedSharedChatBadgeContext';
import { getMessageBadges } from '../util/sharedChatBadges/getMessageBadges';

const VISIBLE_ASSET_HYDRATION_DELAY_MS = 150;

interface UseChatMessageProcessingOptions {
  channelId: string;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  messages$: { peek: () => AnyChatMessageType[] };
  show7TvEmotes: boolean;
  show7tvBadges: boolean;
  userLogin?: string | null;
  isAtBottomRef: RefObject<boolean>;
  maintainBottomAfterContentChange: () => void;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: {
      retryMissingBadge?: boolean;
    },
  ) => Promise<void>;
}

export function useChatMessageProcessing({
  channelId,
  handleNewMessage,
  messages$,
  fetchUserCosmetics,
  isAtBottomRef,
  maintainBottomAfterContentChange,
  show7TvEmotes,
  show7tvBadges,
  userLogin,
}: UseChatMessageProcessingOptions) {
  const composeMessageWithEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
    ): AnyChatMessageType => {
      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) {
        return baseMessage;
      }

      if (!hasEnrichmentEmoteSources(emoteData)) {
        return baseMessage;
      }

      try {
        const replacedMessage = resolveMessageEmoteParts({
          channelId,
          emoteData,
          show7TvEmotes,
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

        return {
          ...baseMessage,
          message: replacedMessage,
          badges,
        };
      } catch (error) {
        logger.chat.error('Error processing emotes:', error);
        return baseMessage;
      }
    },
    [channelId, show7TvEmotes, userLogin],
  );

  const processMessageEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
      countUnread = true,
    ) => {
      handleNewMessage(
        composeMessageWithEmotes(text, userstate, baseMessage, userId),
        { countUnread },
      );
    },
    [composeMessageWithEmotes, handleNewMessage],
  );

  const enqueueLiveChatMessage = useCallback(
    (baseMessage: AnyChatMessageType, countUnread = true) => {
      handleNewMessage(
        { ...baseMessage, pendingEmoteParse: true },
        { countUnread },
      );
    },
    [handleNewMessage],
  );

  const finalizeBufferedMessage = useCallback(
    (message: AnyChatMessageType): AnyChatMessageType => {
      if (!message.pendingEmoteParse) {
        return message;
      }
      const base = { ...message };
      delete base.pendingEmoteParse;
      const text = replaceEmotesWithText(base.message).trimEnd();
      return composeMessageWithEmotes(
        text,
        base.userstate,
        base,
        base.userstate['user-id'],
      );
    },
    [composeMessageWithEmotes],
  );

  const reprocessVisibleMessageFromCache = useCallback(
    (message: AnyChatMessageType) =>
      enrichVisibleMessage({
        channelId,
        message,
        show7TvEmotes,
        userLogin,
      }),
    [channelId, show7TvEmotes, userLogin],
  );

  const hydrationEpochRef = useRef(0);
  const activeHydrationPassRef = useRef<Promise<void> | null>(null);
  const latestVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);

  useEffect(() => {
    return () => {
      hydrationEpochRef.current += 1;
      // This hook arms the debounce below, so it owns stopping it. The pass
      // also reads scratch state that a channel switch resets, so a timer left
      // running would hydrate the new channel against the old one's messages.
      clearVisibleAssetHydrationTimer();
    };
  }, [channelId]);

  const scheduleVisibleAssetHydrationPass = useCallback(() => {
    if (visibleAssetHydration.timer) {
      return;
    }

    const epoch = hydrationEpochRef.current;

    visibleAssetHydration.timer = setTimeout(() => {
      visibleAssetHydration.timer = null;

      const previousPass = activeHydrationPassRef.current ?? Promise.resolve();
      const pass = previousPass
        .then(() => {
          if (hydrationEpochRef.current !== epoch) {
            return undefined;
          }

          const messages = visibleAssetHydration.pendingMessages;
          visibleAssetHydration.pendingMessages = [];
          const shouldMaintainBottom = isAtBottomRef.current;

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
            hydrateCosmetics: show7tvBadges,
            reprocessMessage: reprocessVisibleMessageFromCache,
            shouldContinue: () => hydrationEpochRef.current === epoch,
          }).then(didReprocessMessages => {
            if (
              didReprocessMessages &&
              shouldMaintainBottom &&
              isAtBottomRef.current
            ) {
              maintainBottomAfterContentChange();
            }
          });
        })
        .catch(error => {
          logger.chat.debug('Visible-asset hydration pass failed:', error);
        });

      activeHydrationPassRef.current = pass;
      void pass.then(() => {
        if (activeHydrationPassRef.current === pass) {
          activeHydrationPassRef.current = null;
        }
      });
    }, VISIBLE_ASSET_HYDRATION_DELAY_MS);
  }, [
    channelId,
    fetchUserCosmetics,
    isAtBottomRef,
    maintainBottomAfterContentChange,
    reprocessVisibleMessageFromCache,
    show7TvEmotes,
    show7tvBadges,
  ]);

  const handleViewableMessagesChange = useCallback(
    (visibleMessages: AnyChatMessageType[]) => {
      latestVisibleMessagesRef.current = visibleMessages;
      visibleAssetHydration.pendingMessages = visibleMessages;
      scheduleVisibleAssetHydrationPass();
    },
    [scheduleVisibleAssetHydrationPass],
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
    void scheduleVisibleAssetHydrationPass();
  }, [personalEmotesVersion, scheduleVisibleAssetHydrationPass]);

  const reprocessAllMessages = useCallback(() => {
    const emoteData = getCurrentEmoteData(channelId);
    if (!emoteData) {
      return;
    }

    enrichMessageSet({
      channelId,
      emoteData,
      messages: messages$.peek(),
      show7TvEmotes,
      userLogin,
    });
  }, [channelId, messages$, show7TvEmotes, userLogin]);

  return {
    enqueueLiveChatMessage,
    finalizeBufferedMessage,
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  };
}
