import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import {
  fetchUserPersonalEmotes,
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePersonalEmotesVersion } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import { hydrateVisibleSevenTvAssets } from '../util/hydrateVisibleSevenTvAssets';
import { createUserStateFromTags } from '../util/messageHandlers/createUserStateFromTags';
import { reprocessMessages } from '../util/reprocessMessages';
import { resolveMessageEmoteParts } from '../util/resolveMessageEmoteParts';
import { getCachedSharedChatBadgeContext } from '../util/sharedChatBadges/getCachedSharedChatBadgeContext';
import { getMessageBadges } from '../util/sharedChatBadges/getMessageBadges';
import { getSharedChatBadgeContext } from '../util/sharedChatBadges/getSharedChatBadgeContext';

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
  hydratedVisibleAssetKeysRef: RefObject<Set<string>>;
  visiblePersonalEmoteUsersRef: RefObject<Set<string>>;
  visibleCosmeticUsersRef: RefObject<Set<string>>;
  pendingVisibleMessagesRef: RefObject<AnyChatMessageType[]>;
  visibleAssetHydrationTimerRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
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
  hydratedVisibleAssetKeysRef,
  isAtBottomRef,
  maintainBottomAfterContentChange,
  pendingVisibleMessagesRef,
  show7TvEmotes,
  show7tvBadges,
  userLogin,
  visibleAssetHydrationTimerRef,
  visibleCosmeticUsersRef,
  visiblePersonalEmoteUsersRef,
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

      const hasEmotes =
        chatStore$.emojis.peek().length > 0 ||
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.twitchChannelEmotes.length > 0 ||
        emoteData.twitchSubscriberEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.sevenTvChannelEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.bttvChannelEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0 ||
        emoteData.ffzChannelEmotes.length > 0;

      if (!hasEmotes) {
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
          void getSharedChatBadgeContext(userstate)
            .then(({ sourceBadge, sourceChannelBadges }) => {
              updateMessages([
                {
                  messageId: baseMessage.message_id,
                  messageNonce: baseMessage.message_nonce,
                  updates: {
                    badges: getMessageBadges({
                      userstate,
                      emoteData,
                      sourceBadge,
                      sourceChannelBadges,
                    }),
                  },
                },
              ]);
            })
            .catch(error => {
              logger.chat.debug('Failed to update shared chat badges:', error);
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
    async (message: AnyChatMessageType) => {
      if (
        message.sender === 'System' ||
        ('notice_tags' in message &&
          message.notice_tags &&
          !message.isAnnouncement &&
          !message.isHighlightedMessage)
      ) {
        return;
      }

      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) {
        return;
      }

      const text = replaceEmotesWithText(message.message).trimEnd();
      if (!text.trim()) {
        return;
      }

      const userId = message.userstate['user-id'];

      try {
        const replacedMessage = resolveMessageEmoteParts({
          channelId,
          emoteData,
          show7TvEmotes,
          text,
          userId,
          userLogin,
          userstate: message.userstate,
        });

        const { sourceBadge, sourceChannelBadges } =
          await getSharedChatBadgeContext(message.userstate);
        const badges = getMessageBadges({
          userstate: message.userstate,
          emoteData,
          sourceBadge,
          sourceChannelBadges,
        });

        updateMessages([
          {
            messageId: message.message_id,
            messageNonce: message.message_nonce,
            updates: {
              message: replacedMessage,
              badges,
            },
          },
        ]);
      } catch (error) {
        logger.chat.debug('Failed to reprocess visible chat message:', error);
      }
    },
    [channelId, show7TvEmotes, userLogin],
  );

  const hydrationEpochRef = useRef(0);
  const activeHydrationPassRef = useRef<Promise<void> | null>(null);
  const latestVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);

  useEffect(() => {
    return () => {
      hydrationEpochRef.current += 1;
    };
  }, [channelId]);

  const scheduleVisibleAssetHydrationPass = useCallback(() => {
    if (visibleAssetHydrationTimerRef.current) {
      return;
    }

    const epoch = hydrationEpochRef.current;

    visibleAssetHydrationTimerRef.current = setTimeout(() => {
      visibleAssetHydrationTimerRef.current = null;

      const previousPass = activeHydrationPassRef.current ?? Promise.resolve();
      const pass = previousPass
        .then(() => {
          if (hydrationEpochRef.current !== epoch) {
            return undefined;
          }

          const messages = pendingVisibleMessagesRef.current;
          pendingVisibleMessagesRef.current = [];
          const shouldMaintainBottom = isAtBottomRef.current;

          return hydrateVisibleSevenTvAssets({
            channelId,
            messages,
            hydratedMessageKeys: hydratedVisibleAssetKeysRef.current,
            personalEmoteUsers: visiblePersonalEmoteUsersRef.current,
            cosmeticUsers: visibleCosmeticUsersRef.current,
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
    hydratedVisibleAssetKeysRef,
    isAtBottomRef,
    maintainBottomAfterContentChange,
    pendingVisibleMessagesRef,
    reprocessVisibleMessageFromCache,
    show7TvEmotes,
    show7tvBadges,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  ]);

  const handleViewableMessagesChange = useCallback(
    (visibleMessages: AnyChatMessageType[]) => {
      latestVisibleMessagesRef.current = visibleMessages;
      pendingVisibleMessagesRef.current = visibleMessages;
      scheduleVisibleAssetHydrationPass();
    },
    [pendingVisibleMessagesRef, scheduleVisibleAssetHydrationPass],
  );

  const personalEmotesVersion = usePersonalEmotesVersion();
  const lastPersonalEmotesVersionRef = useRef(personalEmotesVersion);

  useEffect(() => {
    if (lastPersonalEmotesVersionRef.current === personalEmotesVersion) {
      return;
    }
    lastPersonalEmotesVersionRef.current = personalEmotesVersion;
    hydratedVisibleAssetKeysRef.current.clear();
    pendingVisibleMessagesRef.current = latestVisibleMessagesRef.current;
    void scheduleVisibleAssetHydrationPass();
  }, [
    hydratedVisibleAssetKeysRef,
    pendingVisibleMessagesRef,
    personalEmotesVersion,
    scheduleVisibleAssetHydrationPass,
  ]);

  const reprocessAllMessages = useCallback(() => {
    reprocessMessages(messages$.peek(), processMessageEmotes);
  }, [messages$, processMessageEmotes]);

  return {
    enqueueLiveChatMessage,
    finalizeBufferedMessage,
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  };
}
