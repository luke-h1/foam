import { useCallback } from 'react';
import type { MutableRefObject } from 'react';

import { prefetchImage } from '@app/components/Image/imagePrefetch';
import {
  fetchUserPersonalEmotes,
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { extractEmotesFromTag } from '@app/utils/chat/extractEmotes';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { cacheImageFromUrl } from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';

import { normaliseChatUsername } from '../util/chatUsernames';
import { hydrateVisibleSevenTvAssets } from '../util/hydrateVisibleSevenTvAssets';
import {
  type AnyChatMessageType,
  createUserStateFromTags,
} from '../util/messageHandlers';
import { reprocessMessages } from '../util/reprocessMessages';
import {
  getCachedSharedChatBadgeContext,
  getMessageBadges,
  getSharedChatBadgeContext,
} from '../util/sharedChatBadges';

const VISIBLE_ASSET_HYDRATION_DELAY_MS = 150;

function warmVisibleImages({
  badgeUrls,
  emoteUrls,
}: {
  badgeUrls: string[];
  emoteUrls: string[];
}) {
  const warm = (url: string, variant: 'badge' | 'emote') => {
    void cacheImageFromUrl(url, {
      priority: 'visible',
      variant,
    }).then(cachedUri => {
      if (cachedUri !== url) {
        void prefetchImage(cachedUri);
      }
    });
  };

  badgeUrls.forEach(url => warm(url, 'badge'));
  emoteUrls.forEach(url => warm(url, 'emote'));
}

interface UseChatMessageProcessingOptions {
  channelId: string;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  messages$: { peek: () => AnyChatMessageType[] };
  show7TvEmotes: boolean;
  show7tvBadges: boolean;
  disableEmoteAnimations: boolean;
  userLogin?: string | null;
  hydratedVisibleAssetKeysRef: MutableRefObject<Set<string>>;
  visiblePersonalEmoteUsersRef: MutableRefObject<Set<string>>;
  visibleCosmeticUsersRef: MutableRefObject<Set<string>>;
  pendingVisibleMessagesRef: MutableRefObject<AnyChatMessageType[]>;
  visibleAssetHydrationTimerRef: MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  isAtBottomRef: MutableRefObject<boolean>;
  maintainBottomAfterContentChange: () => void;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: {
      allowAfterInitialWindow?: boolean;
      retryMissingBadge?: boolean;
    },
  ) => Promise<void>;
}

export function useChatMessageProcessing({
  channelId,
  handleNewMessage,
  messages$,
  disableEmoteAnimations,
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
  const processMessageEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
      countUnread = true,
    ) => {
      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) {
        handleNewMessage(baseMessage, { countUnread });
        return;
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
        handleNewMessage(baseMessage, { countUnread });
        return;
      }

      const personalEmotes =
        userId && show7TvEmotes ? getUserPersonalEmotes(userId, channelId) : [];
      const currentUserLogin = normaliseChatUsername(userLogin);
      const senderLogin = normaliseChatUsername(
        userstate.login || userstate.username,
      );
      const twitchTaggedSubscriberEmotes = extractEmotesFromTag(
        userstate.emotes,
        text.trimEnd(),
      );
      const twitchSubscriberEmotes =
        senderLogin && senderLogin === currentUserLogin
          ? emoteData.twitchSubscriberEmotes
          : [];
      const scopedTwitchSubscriberEmotes =
        twitchTaggedSubscriberEmotes.length > 0
          ? [...twitchTaggedSubscriberEmotes, ...twitchSubscriberEmotes]
          : twitchSubscriberEmotes;

      try {
        const replacedMessage = processEmotesWorklet({
          inputString: text.trimEnd(),
          userstate,
          emojiEmotes: chatStore$.emojis.peek(),
          sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
          sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
          sevenTvPersonalEmotes: personalEmotes,
          twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
          twitchChannelEmotes: emoteData.twitchChannelEmotes,
          twitchSubscriberEmotes: scopedTwitchSubscriberEmotes,
          ffzChannelEmotes: emoteData.ffzChannelEmotes,
          ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
          bttvChannelEmotes: emoteData.bttvChannelEmotes,
          bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
        });

        const cachedSharedBadgeContext =
          getCachedSharedChatBadgeContext(userstate);
        const badges = getMessageBadges({
          userstate,
          emoteData,
          sourceBadge: cachedSharedBadgeContext?.sourceBadge,
          sourceChannelBadges: cachedSharedBadgeContext?.sourceChannelBadges,
        });

        handleNewMessage(
          {
            ...baseMessage,
            message: replacedMessage,
            badges,
          },
          { countUnread },
        );

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
      } catch (error) {
        logger.chat.error('Error processing emotes:', error);
        handleNewMessage(baseMessage, { countUnread });
      }
    },
    [channelId, handleNewMessage, show7TvEmotes, userLogin],
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
      const personalEmotes =
        userId && show7TvEmotes ? getUserPersonalEmotes(userId, channelId) : [];
      const currentUserLogin = normaliseChatUsername(userLogin);
      const senderLogin = normaliseChatUsername(
        message.userstate.login || message.userstate.username,
      );
      const twitchTaggedSubscriberEmotes = extractEmotesFromTag(
        message.userstate.emotes,
        text,
      );
      const twitchSubscriberEmotes =
        senderLogin && senderLogin === currentUserLogin
          ? emoteData.twitchSubscriberEmotes
          : [];
      const scopedTwitchSubscriberEmotes =
        twitchTaggedSubscriberEmotes.length > 0
          ? [...twitchTaggedSubscriberEmotes, ...twitchSubscriberEmotes]
          : twitchSubscriberEmotes;

      try {
        const replacedMessage = processEmotesWorklet({
          inputString: text,
          userstate: message.userstate,
          emojiEmotes: chatStore$.emojis.peek(),
          sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
          sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
          sevenTvPersonalEmotes: personalEmotes,
          twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
          twitchChannelEmotes: emoteData.twitchChannelEmotes,
          twitchSubscriberEmotes: scopedTwitchSubscriberEmotes,
          ffzChannelEmotes: emoteData.ffzChannelEmotes,
          ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
          bttvChannelEmotes: emoteData.bttvChannelEmotes,
          bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
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

  const handleViewableMessagesChange = useCallback(
    (visibleMessages: AnyChatMessageType[]) => {
      pendingVisibleMessagesRef.current = visibleMessages;
      if (visibleAssetHydrationTimerRef.current) {
        return;
      }

      visibleAssetHydrationTimerRef.current = setTimeout(() => {
        visibleAssetHydrationTimerRef.current = null;
        const messages = pendingVisibleMessagesRef.current;
        pendingVisibleMessagesRef.current = [];
        const shouldMaintainBottom = isAtBottomRef.current;

        void hydrateVisibleSevenTvAssets({
          channelId,
          messages,
          hydratedMessageKeys: hydratedVisibleAssetKeysRef.current,
          personalEmoteUsers: visiblePersonalEmoteUsersRef.current,
          cosmeticUsers: visibleCosmeticUsersRef.current,
          disableEmoteAnimations,
          getUserPersonalEmotes,
          fetchUserPersonalEmotes,
          getUserBadge: twitchUserId => getUserBadge(twitchUserId) ?? null,
          fetchUserCosmetics,
          hydratePersonalEmotes: show7TvEmotes,
          hydrateCosmetics: show7tvBadges,
          warmVisibleImages,
          reprocessMessage: reprocessVisibleMessageFromCache,
        }).then(didReprocessMessages => {
          if (
            didReprocessMessages &&
            shouldMaintainBottom &&
            isAtBottomRef.current
          ) {
            maintainBottomAfterContentChange();
          }
        });
      }, VISIBLE_ASSET_HYDRATION_DELAY_MS);
    },
    [
      channelId,
      disableEmoteAnimations,
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
    ],
  );

  const reprocessAllMessages = useCallback(() => {
    reprocessMessages(messages$.peek(), processMessageEmotes);
  }, [messages$, processMessageEmotes]);

  return {
    processMessageEmotes,
    reprocessAllMessages,
    handleViewableMessagesChange,
  };
}
