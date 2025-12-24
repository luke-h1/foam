/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useEmoteProcessor } from '@app/hooks/useEmoteProcessor';
import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { useTwitchWs } from '@app/hooks/useTwitchWs';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import {
  ChatMessageType,
  useLoadingState,
  useMessages,
  useChannelEmoteData,
  loadChannelResources,
  clearChannelResources,
  clearTtvUsers,
  addMessage,
  addMessages,
  clearMessages,
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  clearCache,
} from '@app/store/chatStore';
import {
  UserNoticeTagsByVariant,
  UserNoticeTags,
  SubscriptionTags,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { findBadges } from '@app/utils/chat/findBadges';
import {
  createSubscriptionPart,
  createViewerMilestonePart,
} from '@app/utils/chat/formatSubscriptionNotice';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';
import { createHitslop } from '@app/utils/string/createHitSlop';
import { generateNonce } from '@app/utils/string/generateNonce';
import { truncate } from '@app/utils/string/truncate';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { FlashListRef } from '@shopify/flash-list';
import omit from 'lodash/omit';
import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { ChatAutoCompleteInput } from '../ChatAutoCompleteInput';
import { FlashList } from '../FlashList';
import { Icon } from '../Icon';
import { Typography } from '../Typography';

import { ChatMessage, ResumeScroll } from './components';
import { EmoteSheet, EmotePickerItem } from './components/EmoteSheet';
import {
  createTestPrimeSubNotice,
  createTestTier1SubNotice,
  createTestTier2SubNotice,
  createTestTier3SubNotice,
  createTestSubNotice,
  createTestViewerMilestoneNotice,
} from './util/createTestUserNotices';

type AnyChatMessageType =
  | ChatMessageType<'usernotice', 'viewermilestone'>
  | ChatMessageType<'usernotice', 'sub'>
  | ChatMessageType<'usernotice', 'resub'>
  | ChatMessageType<'usernotice', 'subgift'>
  | ChatMessageType<'usernotice', 'anongiftpaidupgrade'>
  | ChatMessageType<'usernotice', 'raid'>
  | ChatMessageType<'usernotice'>;

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const hasPartedRef = useRef<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const initializedChannelRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isNavigatingAwayRef = useRef<boolean>(false);
  const loadingAbortRef = useRef<AbortController | null>(null);

  const currentEmoteSetIdRef = useRef<string | null>(null);
  const emoteReprocessAttemptedRef = useRef<string | null>(null);

  // Use legend-state hooks and actions
  const loadingState = useLoadingState();
  const messages = useMessages();

  // Actions are imported directly from store

  const sevenTvEmoteSetId = useMemo(() => {
    return getSevenTvEmoteSetId(channelId) || undefined;
  }, [channelId]);

  useTwitchWs();

  // Use reactive hook for channel-specific emote data - re-renders when emotes load for this channel
  const channelEmoteData = useChannelEmoteData(channelId);

  // Initialize emote processor with current emote data
  const emoteProcessor = useEmoteProcessor({
    sevenTvGlobalEmotes: channelEmoteData.sevenTvGlobalEmotes,
    sevenTvChannelEmotes: channelEmoteData.sevenTvChannelEmotes,
    twitchGlobalEmotes: channelEmoteData.twitchGlobalEmotes,
    twitchChannelEmotes: channelEmoteData.twitchChannelEmotes,
    ffzChannelEmotes: channelEmoteData.ffzChannelEmotes,
    ffzGlobalEmotes: channelEmoteData.ffzGlobalEmotes,
    bttvChannelEmotes: channelEmoteData.bttvChannelEmotes,
    bttvGlobalEmotes: channelEmoteData.bttvGlobalEmotes,
  });

  const flashListRef = useRef<FlashListRef<AnyChatMessageType>>(null);
  const messagesRef = useRef<AnyChatMessageType[]>([]);
  const messageBatchRef = useRef<AnyChatMessageType[]>([]);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const [isScrollingToBottom, setIsScrollingToBottom] =
    useState<boolean>(false);

  const processMessageBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0) return;

    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];

    // Deduplicate messages within the batch by message_id + message_nonce
    // If a message with the same key exists in batch, keep the newer one (with processed emotes)
    const deduplicatedBatch = batch.reduce((acc, message) => {
      const key = `${message.message_id}_${message.message_nonce}`;

      // Check if message already exists in the batch we're building
      const existingInBatchIndex = acc.findIndex(
        m => `${m.message_id}_${m.message_nonce}` === key,
      );

      if (existingInBatchIndex >= 0) {
        // Replace existing message in batch with newer one (which might have processed emotes)
        acc[existingInBatchIndex] = message;
      } else {
        // New message in batch, add it
        acc.push(message);
      }

      return acc;
    }, [] as AnyChatMessageType[]);

    addMessages(deduplicatedBatch as ChatMessageType<never>[]);

    messagesRef.current = [...messagesRef.current, ...deduplicatedBatch].slice(
      -500,
    );

    // Update unread count
    if (!isAtBottomRef.current && !isScrollingToBottom) {
      setUnreadCount(prev => prev + batch.length);
    }

    // Force scroll to bottom if we're already at bottom (for fast chats)
    if (isAtBottomRef.current && !isScrollingToBottom) {
      setTimeout(() => {
        void flashListRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated: false,
        });
      }, 0);
    }
  }, [isScrollingToBottom, messages.length]);

  const handleNewMessage = useCallback(
    (newMessage: AnyChatMessageType) => {
      // Add to batch
      messageBatchRef.current.push(newMessage);

      // Clear existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      if (messageBatchRef.current.length >= 3) {
        processMessageBatch();
      } else {
        batchTimeoutRef.current = setTimeout(() => {
          processMessageBatch();
        }, 10);
      }
    },
    [processMessageBatch],
  );

  const {
    isConnected: isChatConnected,
    partChannel,
    sendMessage,
    getUserState,
  } = useTwitchChat({
    channel: channelName,
    onMessage: useCallback(
      (_channel: string, tags: Record<string, string>, text: string) => {
        const badgeData = parseBadges(tags.badges as unknown as string);

        // map irc tags to our custom format
        const userstate: UserStateTags = {
          ...tags,
          username: tags['display-name'] || tags.login || '',
          login: tags.login || tags['display-name']?.toLowerCase() || '',
          'badges-raw': badgeData['badges-raw'],
          badges: badgeData.badges,
          'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
          'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
          'reply-parent-display-name': tags['reply-parent-display-name'] || '',
          'reply-parent-user-login': tags['reply-parent-user-login'] || '',
          'user-type': tags['user-type'],
        } as UserStateTags;

        const message_id = userstate.id || '0';

        const replyParentMessageId = tags['reply-parent-msg-id'];
        const replyParentDisplayName = tags['reply-parent-display-name'];
        const replyParentUserLogin = tags['reply-parent-user-login'];
        const replyParentMessageBody = tags['reply-parent-msg-body'];

        let parentColor: string | undefined;
        if (replyParentDisplayName && replyParentDisplayName.trim()) {
          // Try to find parent message to get its color
          if (replyParentMessageId) {
            const replyParent = messages.find(
              message => message?.message_id === replyParentMessageId,
            );
            if (replyParent?.userstate.color) {
              parentColor = replyParent.userstate.color;
            } else {
              parentColor = generateRandomTwitchColor(replyParentDisplayName);
            }
          } else {
            // If no parent message ID, always generate color from username
            parentColor = generateRandomTwitchColor(replyParentDisplayName);
          }
        }

        if (replyParentMessageId && replyParentDisplayName) {
          const replyParent = messages.find(
            message => message?.message_id === replyParentMessageId,
          );

          if (replyParent) {
            setReplyTo({
              messageId: replyParentMessageId,
              username: replyParentDisplayName || '',
              message: replyParentMessageBody || '',
              replyParentUserLogin: replyParentUserLogin || '',
              parentMessage: replaceEmotesWithText(replyParent.message),
            });
          }
        }

        const message_nonce = generateNonce();

        const emoteData = getCurrentEmoteData(channelId);

        // Narrow the type based on msg-id if it's a known usernotice variant
        // When msg-id is 'viewermilestone', notice_tags will be narrowed to ViewerMilestoneTags
        // When msg-id is 'sub', notice_tags will be narrowed to SubscriptionTags, etc.
        let newMessage: AnyChatMessageType;
        const baseMessage: ChatMessageType<'usernotice'> = {
          userstate,
          message: [{ type: 'text', content: text.trimEnd() }],
          badges: [],
          channel: channelName,
          message_id,
          message_nonce,
          sender: userstate.username || '',
          parentDisplayName: tags['reply-parent-display-name'] || '',
          replyDisplayName: tags['reply-parent-user-login'] || '',
          replyBody: tags['reply-parent-msg-body'] || '',
          parentColor: parentColor || undefined,
        };
        // eslint-disable-next-line prefer-const
        newMessage = baseMessage;

        // Always add message immediately to ensure it renders
        // Emote processing will happen async and update if successful
        handleNewMessage(newMessage);

        // Process emotes if available and update message when complete
        if (
          emoteData &&
          (emoteData.twitchGlobalEmotes.length > 0 ||
            emoteData.sevenTvGlobalEmotes.length > 0 ||
            emoteData.bttvGlobalEmotes.length > 0 ||
            emoteData.ffzGlobalEmotes.length > 0)
        ) {
          emoteProcessor.processEmotes(
            text.trimEnd(),
            userstate,
            replacedMessage => {
              try {
                const replacedBadges = findBadges({
                  userstate,
                  chatterinoBadges: emoteData.chatterinoBadges,
                  chatUsers: [], // need to populate from ctx
                  ffzChannelBadges: emoteData.ffzChannelBadges,
                  ffzGlobalBadges: emoteData.ffzGlobalBadges,
                  twitchChannelBadges: emoteData.twitchChannelBadges,
                  twitchGlobalBadges: emoteData.twitchGlobalBadges,
                });

                const updatedMessage: AnyChatMessageType = {
                  ...newMessage,
                  message: replacedMessage,
                  badges: replacedBadges,
                  parentColor: newMessage.parentColor,
                };

                // Update the message with processed emotes
                // Note: This will add a second message, but with the same message_id
                // The FlashList keyExtractor should handle deduplication
                handleNewMessage(updatedMessage);
              } catch (error) {
                logger.chat.error('Error processing emotes:', error);
                // Message already added above, so no need to add again
              }
            },
          );
        }
      },

      [channelId, channelName, emoteProcessor, handleNewMessage, messages],
    ),
    onUserNotice: useCallback(
      (_channel: string, tags: UserNoticeTags, text: string) => {
        // Handle user notice events (subs, raids, etc.)

        // viewermilestone
        /***
         *  LOG  userNoticeTags -> {
  "badge-info": "subscriber/62",
  "badges": "vip/1,subscriber/60,social-sharing/1",
  "color": "#53FFAB",
  "display-name": "LimeTitanTV",
  "emotes": "",
  "flags": "",
  "id": "889b45cc-be97-4abb-a820-b94e14a5ccae",
  "login": "limetitantv",
  "mod": "0",
  "msg-id": "viewermilestone",
  "msg-param-category": "watch-streak",
  "msg-param-copoReward": "450",
  "msg-param-id": "4cc8144a-73fb-4e7a-983f-a5291f2eee57",
  "msg-param-value": "20",
  "room-id": "146110596",
  "subscriber": "1",
  "system-msg": "LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!",
  "tmi-sent-ts": "1763323766846",
  "user-id": "63102149",
  "user-type": "",
  "vip": "1"
}
         */
        const message_nonce = generateNonce();

        let newMessage: AnyChatMessageType;

        const userstate: UserStateTags = {
          ...tags,
          username: tags['display-name'] || tags.login || '',
          login: tags.login || tags['display-name']?.toLowerCase() || '',
          'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
          'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
          'reply-parent-display-name': tags['reply-parent-display-name'] || '',
          'reply-parent-user-login': tags['reply-parent-user-login'] || '',
          'user-type': tags['user-type'],
        } as UserStateTags;

        const tagId = 'id' in tags ? (tags as { id?: string }).id : undefined;
        const baseMessage = {
          message: [{ type: 'text' as const, content: text.trimEnd() }],
          badges: {},
          channel: channelName,
          message_id: tags['msg-id'] || tagId || generateNonce(),
          message_nonce,
          sender: userstate.username || '',
          parentDisplayName:
            typeof tags['reply-parent-display-name'] === 'string'
              ? tags['reply-parent-display-name']
              : '',
          replyDisplayName: tags['reply-parent-user-login'] || '',
          replyBody: tags['reply-parent-msg-body'] || '',
          ...omit(userstate, 'message'),
        };

        /**
         * Narrow the msg id so we can match up notice_tags with the correct
         */
        switch (tags['msg-id']) {
          case 'viewermilestone': {
            const viewerMilestoneTags: ViewerMilestoneTags = {
              'msg-id': 'viewermilestone' as const,
              'msg-param-category': (tags['msg-param-category'] ??
                'watch-streak') as 'watch-streak',
              'msg-param-copoReward': tags['msg-param-copoReward'] ?? '',
              'msg-param-id': tags['msg-param-id'] ?? '',
              'msg-param-value': tags['msg-param-value'] ?? '',
              'badge-info': tags['badge-info'] ?? '',
              'display-name': tags['display-name'] ?? '',
              'system-msg': tags['system-msg'] ?? '',
              login: tags.login ?? '',
              'user-id': tags['user-id'] ?? '',
              'user-type': tags['user-type'] ?? '',
              color: tags.color ?? '',
              badges: tags.badges ?? '',
              emotes: tags.emotes ?? '',
              flags: tags.flags ?? '',
              mod: tags.mod ?? '',
            } satisfies ViewerMilestoneTags;

            const viewerMilestonePart = createViewerMilestonePart(
              viewerMilestoneTags,
              text,
            );

            const viewerMilestoneMessage: ChatMessageType<
              'usernotice',
              'viewermilestone'
            > = {
              ...baseMessage,
              replyDisplayName:
                typeof tags['reply-parent-display-name'] === 'string'
                  ? tags['reply-parent-display-name']
                  : '',
              replyBody: '',
              badges: [],
              userstate,
              message: [viewerMilestonePart],
              notice_tags: {
                'msg-id': tags['msg-id'],
                'msg-param-category': tags['msg-param-category'],
                'msg-param-copoReward': tags['msg-param-copoReward'] ?? '',
                'msg-param-id': tags['msg-param-id'] ?? '',
                'msg-param-value': tags['msg-param-value'] ?? '',
                'badge-info': tags['badge-info'] ?? '',
                'display-name': tags['display-name'] ?? '',
                'system-msg': tags['system-msg'] ?? '',
                sender: '',
                replyDisplayName: '',
                replyBody: '',
                channel: '',
              } satisfies UserNoticeTagsByVariant<'viewermilestone'>,
            };
            newMessage = viewerMilestoneMessage;
            handleNewMessage(viewerMilestoneMessage);
            break;
          }

          case 'resub': {
            const resubTags = tags;
            logger.main.info('resubTags', JSON.stringify(resubTags, null, 2));

            const subscriptionPart = createSubscriptionPart(resubTags, text);

            const resubMessage: ChatMessageType<'usernotice', 'resub'> = {
              ...baseMessage,
              badges: [],
              message: [subscriptionPart],
              userstate,
              notice_tags: {
                ...resubTags,
                sender: '',
                replyDisplayName: '',
                replyBody: '',
                channel: '',
                parentDisplayName: '',
              },
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = resubMessage;
            handleNewMessage(resubMessage);
            break;
          }

          case 'sub': {
            const subTags = tags;

            const subscriptionPart = createSubscriptionPart(subTags, text);

            const subMessage: ChatMessageType<'usernotice', 'sub'> = {
              ...baseMessage,
              notice_tags: subTags,
              message_nonce: generateNonce(),
              badges: [],
              message: [subscriptionPart],
              userstate,
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = subMessage;
            handleNewMessage(subMessage);
            break;
          }
          case 'subgift': {
            const subGiftTags = tags;

            const subscriptionPart = createSubscriptionPart(subGiftTags, text);

            const subGiftMessage: ChatMessageType<'usernotice', 'subgift'> = {
              ...baseMessage,
              badges: [],
              message: [subscriptionPart],
              userstate,
              notice_tags: {
                ...subGiftTags,
                sender: '',
                replyDisplayName: '',
                replyBody: '',
                channel: '',
                parentDisplayName: '',
              },
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = subGiftMessage;
            handleNewMessage(subGiftMessage);
            break;
          }
          case 'anongiftpaidupgrade': {
            const anonGiftPaidUpgradeTags = tags;

            const subscriptionPart = createSubscriptionPart(
              anonGiftPaidUpgradeTags,
              text,
            );

            const anonGiftPaidUpgradeMessage: ChatMessageType<
              'usernotice',
              'anongiftpaidupgrade'
            > = {
              ...baseMessage,
              badges: [],
              message: [subscriptionPart],
              userstate,
              notice_tags: {
                ...anonGiftPaidUpgradeTags,
                sender: '',
                replyDisplayName: '',
                replyBody: '',
                channel: '',
                parentDisplayName: '',
              },
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = anonGiftPaidUpgradeMessage;
            handleNewMessage(anonGiftPaidUpgradeMessage);
            break;
          }
          case 'raid': {
            const raidTags = tags;

            const raidMessage: ChatMessageType<'usernotice', 'raid'> = {
              ...baseMessage,
              badges: [],
              message: [],
              userstate,
              notice_tags: {
                ...raidTags,
                sender: '',
                replyDisplayName: '',
                replyBody: '',
                channel: '',
                parentDisplayName: '',
              },
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = raidMessage;
            handleNewMessage(raidMessage);
            break;
          }
          default: {
            const fallbackMessage: ChatMessageType<'usernotice'> = {
              ...baseMessage,
              userstate,
              badges: [],
              message: [],
              sender: '',
              replyDisplayName: '',
              replyBody: '',
              channel: '',
              parentDisplayName: '',
            };
            newMessage = fallbackMessage;
            handleNewMessage(newMessage);
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    onClearChat: useCallback(() => {
      clearMessages();
      messagesRef.current = [];
      setTimeout(() => {
        void flashListRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated: false,
        });
      }, 0);
    }, [messages.length]),
    onJoin: useCallback(() => {
      logger.chat.info('Joined channel:', channelName);

      addMessage({
        userstate: {
          'display-name': 'System',
          login: 'system',
          username: 'System',
          'user-id': '',
          id: '',
          color: '#808080',
          badges: {},
          'badges-raw': '',
          'user-type': '',
          mod: '0',
          subscriber: '0',
          turbo: '0',
          'emote-sets': '',
          'reply-parent-msg-id': '',
          'reply-parent-msg-body': '',
          'reply-parent-display-name': '',
          'reply-parent-user-login': '',
        },
        message: [
          { type: 'text', content: `Connected to ${channelName}'s room` },
        ],
        badges: [],
        channel: channelName,
        message_id: `system-join-${Date.now()}`,
        message_nonce: generateNonce(),
        sender: 'System',
        parentDisplayName: '',
        replyDisplayName: '',
        replyBody: '',
        parentColor: undefined,
      });
    }, [channelName]),

    onPart: useCallback(() => {
      logger.chat.info('Parted from channel:', channelName);
      clearMessages();
      messagesRef.current = [];
    }, [channelName]),
  });

  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = () => {
      const isConnected = isChatConnected();
      setConnected(isConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [isChatConnected]);

  const { subscribeToChannel, unsubscribeFromChannel, isConnected } =
    useSeventvWs({
      // eslint-disable-next-line no-shadow
      onEmoteUpdate: ({ added, removed, channelId }) => {
        logger.stvWs.info(
          `Channel ${channelId}: +${added.length} -${removed.length} emotes`,
        );
      },
      onEvent: (eventType, _data) => {
        console.log(`SevenTV event: ${eventType}`);
      },
      twitchChannelId: channelId,
      sevenTvEmoteSetId,
    });

  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      // eslint-disable-next-line no-shadow
      const connected = isConnected();
      setWsConnected(connected);
    };

    checkConnection();

    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    console.log('🔍 SevenTV subscription effect running:', {
      isConnected: wsConnected,
      channelId,
      loadingState,
      allConditionsMet: wsConnected && channelId,
    });

    if (wsConnected && channelId) {
      const emoteSetId = getSevenTvEmoteSetId(channelId);

      console.log('emoteSetId ->', emoteSetId);
      console.log('loadingState ->', loadingState);
      console.log('channelId ->', channelId);

      if (emoteSetId) {
        if (
          currentEmoteSetIdRef.current &&
          currentEmoteSetIdRef.current !== emoteSetId
        ) {
          logger.stvWs.info(
            `Unsubscribing from previous SevenTV emote set: ${currentEmoteSetIdRef.current}`,
          );
          unsubscribeFromChannel();
        }

        if (currentEmoteSetIdRef.current !== emoteSetId) {
          currentEmoteSetIdRef.current = emoteSetId;

          logger.stvWs.info(
            `Subscribing to SevenTV emote set: ${emoteSetId} for channel: ${channelId}`,
          );
          subscribeToChannel(emoteSetId);
        }

        return () => {
          logger.stvWs.info(
            `Unsubscribing from SevenTV emote set: ${emoteSetId} for channel: ${channelId}`,
          );
          unsubscribeFromChannel();
          currentEmoteSetIdRef.current = null;
        };
      }
      logger.stvWs.info(
        `No SevenTV emote set ID found for channel: ${channelId}, will retry when available`,
      );
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, subscribeToChannel, unsubscribeFromChannel, wsConnected]);

  useEffect(() => {
    if (wsConnected && channelId && loadingState === 'COMPLETED') {
      const emoteSetId = getSevenTvEmoteSetId(channelId);

      if (emoteSetId && currentEmoteSetIdRef.current !== emoteSetId) {
        logger.stvWs.info(
          `Emote data now available, subscribing to SevenTV emote set: ${emoteSetId}`,
        );
        currentEmoteSetIdRef.current = emoteSetId;
        subscribeToChannel(emoteSetId);
      }
    }
  }, [wsConnected, channelId, loadingState, subscribeToChannel]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      console.log('🚪 Screen is being removed, cleaning up chat connection...');

      // Mark as navigating away immediately to prevent skeleton from showing
      isNavigatingAwayRef.current = true;
      isMountedRef.current = false;

      // Reset loading state immediately to allow navigation
      clearChannelResources();

      // Abort any ongoing loading
      if (loadingAbortRef.current) {
        loadingAbortRef.current.abort();
        loadingAbortRef.current = null;
      }

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
        console.log(`👋 Parting channel: ${channelName}`);
        partChannel(channelName);
      }

      // Clear messages when leaving
      clearMessages();
      messagesRef.current = [];
      messageBatchRef.current = [];

      setConnected(false);
      initializedChannelRef.current = null;
      initializingRef.current = false;
      currentEmoteSetIdRef.current = null;
    });

    return () => {
      isMountedRef.current = false;
      isNavigatingAwayRef.current = false;
      hasPartedRef.current = false;
      unsubscribe();
      clearChannelResources();
      clearTtvUsers();
      clearMessages();
      messagesRef.current = [];
      messageBatchRef.current = [];
      if (loadingAbortRef.current) {
        loadingAbortRef.current.abort();
        loadingAbortRef.current = null;
      }
      currentEmoteSetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, channelName, partChannel, clearMessages]);

  const [_connectionError] = useState<string | null>(null);

  const [messageInput, setMessageInput] = useState<string>('');

  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    username: string;
    message: string;
    replyParentUserLogin: string;
    parentMessage: string;
  } | null>(null);

  const [, setIsInputFocused] = useState<boolean>(false);

  const BOTTOM_THRESHOLD = 50;
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // Only update state if not currently auto-scrolling, or if we've reached the bottom
      if (!isScrollingToBottom || atBottom) {
        isAtBottomRef.current = atBottom;
        setIsAtBottom(atBottom);

        if (isScrollingToBottom && atBottom) {
          setIsScrollingToBottom(false);
        }
      }

      if (atBottom) {
        setUnreadCount(0);
      }
    },
    [isScrollingToBottom],
  );

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        void flashListRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated: false,
        });
      }
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    setIsScrollingToBottom(true);
    const lastIndex = messages.length - 1;

    if (lastIndex >= 0) {
      void flashListRef.current?.scrollToIndex({
        index: messages.length - 1,
        animated: true,
      });
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      setIsScrollingToBottom(false);
      scrollTimeoutRef.current = null;
    }, 100);
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages as AnyChatMessageType[];
  }, [messages]);

  /**
   * Reprocess existing messages when emote data becomes available
   * This effect also triggers when messages arrive, so we can catch messages
   * that arrived before emotes loaded. The ref check ensures we only reprocess once.
   */
  useEffect(() => {
    const hasEmotes =
      channelEmoteData.sevenTvGlobalEmotes.length > 0 ||
      channelEmoteData.sevenTvChannelEmotes.length > 0 ||
      channelEmoteData.twitchGlobalEmotes.length > 0 ||
      channelEmoteData.twitchChannelEmotes.length > 0 ||
      channelEmoteData.bttvGlobalEmotes.length > 0 ||
      channelEmoteData.bttvChannelEmotes.length > 0 ||
      channelEmoteData.ffzGlobalEmotes.length > 0 ||
      channelEmoteData.ffzChannelEmotes.length > 0;

    /**
     * Only reprocess once per channel when emotes are available and we have messages
     */
    if (
      hasEmotes &&
      emoteReprocessAttemptedRef.current !== channelId &&
      messages.length > 0
    ) {
      /**
       * find messages that haven't had emotes processed yet (text-only)
       */
      const textOnlyMessages = (messages as AnyChatMessageType[]).filter(
        msg => {
          // Skip system messages and notices
          if (msg.sender === 'System' || 'notice_tags' in msg) {
            return false;
          }
          /**
           * Check if all parts are text (no emotes processed)
           */
          return msg.message.every((part: ParsedPart) => part.type === 'text');
        },
      );

      /**
       * Only mark as attempted and reprocess if we have text-only messages
       */
      if (textOnlyMessages.length > 0) {
        emoteReprocessAttemptedRef.current = channelId;

        logger.chat.info(
          `Reprocessing ${textOnlyMessages.length} messages with newly loaded emotes`,
        );

        const emoteData = getCurrentEmoteData(channelId);

        textOnlyMessages.forEach(msg => {
          const textContent = msg.message
            .filter((p: ParsedPart) => p.type === 'text')
            .map((p: ParsedPart) => (p as { content: string }).content)
            .join('');

          if (textContent.trim()) {
            emoteProcessor.processEmotes(
              textContent,
              msg.userstate,
              replacedMessage => {
                try {
                  const replacedBadges = findBadges({
                    userstate: msg.userstate,
                    chatterinoBadges: emoteData.chatterinoBadges || [],
                    chatUsers: [],
                    ffzChannelBadges: emoteData.ffzChannelBadges || [],
                    ffzGlobalBadges: emoteData.ffzGlobalBadges || [],
                    twitchChannelBadges: emoteData.twitchChannelBadges || [],
                    twitchGlobalBadges: emoteData.twitchGlobalBadges || [],
                  });

                  handleNewMessage({
                    ...msg,
                    message: replacedMessage,
                    badges: replacedBadges,
                  });
                } catch (error) {
                  logger.chat.error(
                    'Error reprocessing message emotes:',
                    error,
                  );
                }
              },
            );
          }
        });
      } else if (messages.length > 0) {
        /**
         * All existing messages already have emotes processed, mark as done
         */
        emoteReprocessAttemptedRef.current = channelId;
      }
    }
  }, [channelId, channelEmoteData, emoteProcessor, handleNewMessage, messages]);

  // Reset refs on mount and when channelId changes
  useEffect(() => {
    // Reset all refs when component mounts or channel changes
    isMountedRef.current = true;
    isNavigatingAwayRef.current = false;
    hasPartedRef.current = false;
    initializingRef.current = false;
    currentEmoteSetIdRef.current = null;
    emoteReprocessAttemptedRef.current = null;

    // Clear any pending timeouts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Only clear if we had a previous channel initialized
    if (
      initializedChannelRef.current &&
      initializedChannelRef.current !== channelId
    ) {
      clearMessages();
      messagesRef.current = [];
      messageBatchRef.current = [];
    }
    initializedChannelRef.current = channelId;

    return () => {
      isMountedRef.current = false;
      hasPartedRef.current = false;
      currentEmoteSetIdRef.current = null;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [channelId]);

  useEffect(() => {
    // Abort any previous loading
    if (loadingAbortRef.current) {
      loadingAbortRef.current.abort();
    }

    if (
      channelId &&
      channelId.trim() &&
      authState?.token.accessToken &&
      isMountedRef.current
    ) {
      loadingAbortRef.current = new AbortController();
      const abortController = loadingAbortRef.current;

      void loadChannelResources(channelId).then(success => {
        // Only process result if component is still mounted and not aborted
        if (isMountedRef.current && !abortController.signal.aborted) {
          console.log('📡 loadChannelResources result:', success);
          if (!success) {
            console.log('❌ loadChannelResources failed');
          }
        }
      });

      return () => {
        abortController.abort();
      };
    }

    return undefined;
  }, [channelId, authState?.token.accessToken]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !isChatConnected()) {
      return;
    }

    const messageText = replyTo
      ? `@${replyTo.username} ${messageInput}`
      : messageInput;

    const currentUserState = getUserState();
    const badgeData = parseBadges(
      (currentUserState.badges as unknown as string) || '',
    );

    const optimisticUserstate: UserStateTags = {
      ...currentUserState,
      'display-name':
        user?.display_name || currentUserState['display-name'] || '',
      login: user?.login || currentUserState.login || '',
      username:
        user?.display_name ||
        user?.login ||
        currentUserState['display-name'] ||
        currentUserState.login ||
        '',
      'badges-raw': badgeData['badges-raw'],
      badges: badgeData.badges,
      color:
        currentUserState.color ||
        (user?.login ? generateRandomTwitchColor(user.login) : undefined),
      'reply-parent-msg-id': replyTo?.messageId || '',
      'reply-parent-msg-body': replyTo?.message || '',
      'reply-parent-display-name': replyTo?.username || '',
      'reply-parent-user-login': replyTo?.replyParentUserLogin || '',
    } as UserStateTags;

    const emoteData = getCurrentEmoteData(channelId);
    const senderName = user?.display_name || user?.login || '';

    const userBadges = emoteData
      ? findBadges({
          userstate: optimisticUserstate,
          chatterinoBadges: emoteData.chatterinoBadges,
          chatUsers: [],
          ffzChannelBadges: emoteData.ffzChannelBadges,
          ffzGlobalBadges: emoteData.ffzGlobalBadges,
          twitchChannelBadges: emoteData.twitchChannelBadges,
          twitchGlobalBadges: emoteData.twitchGlobalBadges,
        })
      : [];

    // Create optimistic message immediately (without emotes) so it renders right away (as text)
    // if we haven't loaded emote/badge data yet
    const optimisticMessageId = generateNonce();
    const optimisticNonce = generateNonce();
    const optimisticMessage: AnyChatMessageType = {
      userstate: optimisticUserstate,
      message: [{ type: 'text', content: messageText.trimEnd() }],
      badges: userBadges,
      channel: channelName,
      message_id: optimisticMessageId,
      message_nonce: optimisticNonce,
      sender: senderName,
      parentDisplayName: replyTo?.username || '',
      replyDisplayName: replyTo?.replyParentUserLogin || '',
      replyBody: replyTo?.message || '',
      parentColor: undefined,
    };

    handleNewMessage(optimisticMessage);

    /**
     * Process emotes if available and update message when complete
     */
    if (
      emoteData &&
      (emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0)
    ) {
      emoteProcessor.processEmotes(
        messageText.trimEnd(),
        optimisticUserstate,
        replacedMessage => {
          try {
            // Update the optimistic message with processed emotes
            const updatedMessage: AnyChatMessageType = {
              ...optimisticMessage,
              message: replacedMessage,
            };

            // Replace the existing message with the emote-processed one
            handleNewMessage(updatedMessage);
          } catch (error) {
            logger.chat.error(
              'Error processing emotes for optimistic message:',
              error,
            );
            // If emote processing fails, the original message is already added.
          }
        },
      );
    }

    // Then send up to Twitch IRC
    if (replyTo) {
      try {
        sendMessage(
          channelName,
          messageText,
          replyTo.messageId,
          replyTo.username,
          replyTo.message,
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, messageText);
    }

    setMessageInput('');
    setReplyTo(null);
  }, [
    channelName,
    messageInput,
    replyTo,
    sendMessage,
    isChatConnected,
    user,
    handleNewMessage,
    getUserState,
    channelId,
    emoteProcessor,
  ]);

  const inputContainerRef = useRef<View>(null);
  const [_inputContainerHeight, setInputContainerHeight] = useState(0);

  const measureInputContainer = useCallback(() => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measure((_x, _y, _width, height) => {
        setInputContainerHeight(height);
      });
    }
  }, []);

  const handleReply = useCallback(
    (message: ChatMessageType<'usernotice'>) => {
      const messageText = replaceEmotesWithText(message.message);
      const parentMessageText = messages.find(
        m => m?.message_id === message.message_id,
      );

      setReplyTo({
        messageId: message.message_id,
        username: message.sender,
        message: messageText,
        replyParentUserLogin: message.userstate.username || '',
        parentMessage: replaceEmotesWithText(
          parentMessageText?.message as ParsedPart[],
        ),
      });
    },
    [messages],
  );

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: AnyChatMessageType }) => (
      <ChatMessage
        channel={item.channel}
        message={item.message}
        userstate={item.userstate}
        badges={item.badges}
        message_id={item.message_id}
        message_nonce={item.message_nonce}
        sender={item.sender}
        style={styles.messageContainer}
        parentDisplayName={item.parentDisplayName}
        parentColor={item.parentColor}
        onReply={handleReply}
        replyDisplayName={item.replyDisplayName}
        replyBody={item.replyBody}
        allMessages={messages}
        // @ts-expect-error - notice_tags having issues being narrowed down
        notice_tags={
          'notice_tags' in item && item.notice_tags
            ? item.notice_tags
            : undefined
        }
      />
    ),
    [handleReply, messages],
  );

  const emoteSheetRef = useRef<TrueSheet>(null);
  const debugModalRef = useRef<BottomSheetModal>(null);
  const chatInputRef = useRef<TextInput>(null);

  const handleEmoteSelect = useCallback((item: EmotePickerItem) => {
    if (typeof item === 'string') {
      setMessageInput(prev => `${prev}${prev.length > 0 ? ' ' : ''}${item} `);
    } else {
      setMessageInput(
        prev => `${prev}${prev.length > 0 ? ' ' : ''}${item.name} `,
      );
    }
    void emoteSheetRef.current?.dismiss();
  }, []);

  const handleOpenEmoteSheet = useCallback(async () => {
    await emoteSheetRef.current?.present();
  }, []);

  const handleTestMessageSelect = useCallback(
    (option: string) => {
      let testMessage: AnyChatMessageType;
      let msgId: string;

      switch (option) {
        case 'Prime Sub':
          testMessage = createTestPrimeSubNotice(1);
          msgId = 'sub';
          break;
        case 'Tier 1 Sub':
          testMessage = createTestTier1SubNotice(1);
          msgId = 'sub';
          break;
        case 'Tier 2 Sub':
          testMessage = createTestTier2SubNotice(1);
          msgId = 'sub';
          break;
        case 'Tier 3 Sub':
          testMessage = createTestTier3SubNotice(1);
          msgId = 'sub';
          break;
        case 'Default Sub':
          testMessage = createTestSubNotice();
          msgId = 'sub';
          break;
        case 'Viewer Milestone':
          testMessage = createTestViewerMilestoneNotice();
          msgId = 'viewermilestone';
          break;
        default:
          testMessage = createTestSubNotice();
          msgId = 'sub';
      }

      let updatedMessage: AnyChatMessageType;

      switch (msgId) {
        case 'viewermilestone': {
          // Handle viewermilestone messages
          const viewerMilestoneTestMessage = testMessage as ChatMessageType<
            'usernotice',
            'viewermilestone'
          >;
          if (!viewerMilestoneTestMessage.notice_tags) {
            throw new Error(
              'Viewer milestone test message must have notice_tags',
            );
          }
          const baseTags = viewerMilestoneTestMessage.notice_tags;
          const viewerMilestoneTags = {
            'msg-id': 'viewermilestone' as const,
            'msg-param-category': (baseTags?.['msg-param-category'] ??
              'watch-streak') as 'watch-streak',
            'msg-param-copoReward': baseTags?.['msg-param-copoReward'] ?? '100',
            'msg-param-id': baseTags?.['msg-param-id'] ?? '',
            'msg-param-value': baseTags?.['msg-param-value'] ?? '10',
            'room-id': channelId,
            'display-name': baseTags?.['display-name'] ?? '',
            'user-id': baseTags?.['user-id'] ?? '',
            'user-type': baseTags?.['user-type'] ?? '',
            color: baseTags?.color ?? '',
            badges: baseTags?.badges ?? '',
            emotes: baseTags?.emotes ?? '',
            flags: baseTags?.flags ?? '',
            mod: baseTags?.mod ?? '',
          } satisfies ViewerMilestoneTags;
          const viewerMilestonePart = createViewerMilestonePart(
            viewerMilestoneTags,
            '',
          );

          updatedMessage = {
            ...viewerMilestoneTestMessage,
            channel: channelName,
            notice_tags: viewerMilestoneTags,
            message: [viewerMilestonePart] as ParsedPart[],
            userstate: {
              ...viewerMilestoneTestMessage.userstate,
              username: viewerMilestoneTestMessage.sender,
              login: viewerMilestoneTestMessage.sender.toLowerCase(),
              'display-name': viewerMilestoneTestMessage.sender,
            },
          };
          break;
        }

        case 'sub':
        case 'resub':
        case 'subgift':
        case 'anongiftpaidupgrade':
        default: {
          // Handle subscription types (sub, resub, subgift, etc.)
          const subscriptionTestMessage = testMessage as ChatMessageType<
            'usernotice',
            'sub'
          >;
          const subscriptionTags: SubscriptionTags =
            subscriptionTestMessage.notice_tags
              ? {
                  ...subscriptionTestMessage.notice_tags,
                  'room-id': channelId,
                }
              : {
                  'msg-id': 'sub',
                  'msg-param-cumulative-months': '1',
                  'msg-param-should-share-streak': '1',
                  'msg-param-streak-months': '1',
                  'msg-param-sub-plan': 'Prime',
                  'msg-param-sub-plan-name': 'Prime',
                  'room-id': channelId,
                  'display-name': subscriptionTestMessage.sender,
                  login: subscriptionTestMessage.sender.toLowerCase(),
                  username: subscriptionTestMessage.sender,
                };
          const subscriptionPart = createSubscriptionPart(subscriptionTags, '');

          updatedMessage = {
            ...subscriptionTestMessage,
            channel: channelName,
            notice_tags: subscriptionTags,
            message: [subscriptionPart],
            userstate: {
              ...subscriptionTestMessage.userstate,
              username: subscriptionTestMessage.sender,
              login: subscriptionTestMessage.sender.toLowerCase(),
              'display-name': subscriptionTestMessage.sender,
            },
          };
          break;
        }
      }

      handleNewMessage(updatedMessage);
      debugModalRef.current?.dismiss();
    },
    [channelName, channelId, handleNewMessage],
  );

  const handleClearImageCache = useCallback(async () => {
    try {
      await clearImageCache(channelId);
      logger.chat.info('Image cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear image cache:', error);
    }
  }, [channelId]);

  const handleClearChatCache = useCallback(() => {
    try {
      clearCache(channelId);
      logger.chat.info('Chat cache cleared successfully');
      debugModalRef.current?.dismiss();
    } catch (error) {
      logger.chat.error('Failed to clear chat cache:', error);
    }
  }, [channelId]);

  // Deduplicate messages by message_id + message_nonce
  // Keep the last occurrence (which would be the updated one with processed emotes)
  const deduplicatedMessages = useMemo(() => {
    const messageMap = new Map<string, AnyChatMessageType>();

    messages.forEach(message => {
      const key = `${message?.message_id}_${message?.message_nonce}`;
      // Always keep the latest occurrence (for updates with processed emotes)
      messageMap.set(key, message as AnyChatMessageType);
    });

    return Array.from(messageMap.values());
  }, [messages]);

  // Don't block rendering while emotes are loading - show messages as text
  // and reprocess them when emotes become available
  if (loadingState === 'ERROR') {
    // log to sentry
  }

  return (
    <View style={styles.wrapper}>
      <View style={{ paddingTop: insets.top }}>
        <Typography style={styles.header}>CHAT</Typography>
      </View>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <FlashList
            data={deduplicatedMessages}
            ref={flashListRef}
            keyExtractor={item => {
              // Use message_id + message_nonce as the key
              // These should be unique per message, allowing FlashList to update
              // existing items when we add a message with the same key (e.g., after emote processing)
              return `${item.message_id}_${item.message_nonce}`;
            }}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
            removeClippedSubviews
            contentInsetAdjustmentBehavior="automatic"
            drawDistance={500}
            overrideItemLayout={(layout, item) => {
              const messageLength = item.message?.length || 0;
              const estimatedHeight = Math.max(
                60,
                Math.min(120, 60 + messageLength * 0.5),
              );
              layout.span = estimatedHeight;
            }}
          />
          {!isAtBottom && !isScrollingToBottom && (
            <ResumeScroll
              isAtBottomRef={isAtBottomRef}
              flashListRef={flashListRef}
              setIsAtBottom={setIsAtBottom}
              setUnreadCount={setUnreadCount}
              unreadCount={unreadCount}
              onScrollToBottom={scrollToBottom}
            />
          )}
        </View>

        <View
          ref={inputContainerRef}
          style={[styles.inputWrapper, { paddingBottom: insets.bottom }]}
          onLayout={measureInputContainer}
        >
          {/* Reply Preview */}
          {replyTo && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(100)}
              style={styles.replyPreview}
            >
              <View style={styles.replyIndicator} />
              <View style={styles.replyContent}>
                <Typography style={styles.replyLabel}>
                  Replying to{' '}
                  <Typography style={styles.replyUsername}>
                    {replyTo.username}
                  </Typography>
                </Typography>
                {replyTo.message && (
                  <Typography
                    style={styles.replyMessagePreview}
                    numberOfLines={1}
                  >
                    {truncate(replyTo.message.trim() || replyTo.message, 60)}
                  </Typography>
                )}
              </View>
              <Button
                style={styles.replyDismissButton}
                onPress={() => setReplyTo(null)}
                hitSlop={createHitslop(20)}
              >
                <Icon icon="x" size={18} />
              </Button>
            </Animated.View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            {/* Emote Button */}
            <Button
              style={styles.inputActionButton}
              onPress={() => void handleOpenEmoteSheet()}
              hitSlop={createHitslop(30)}
            >
              <Icon icon="smile" size={22} />
            </Button>

            {/* Chat Input */}
            <View style={styles.inputFieldContainer}>
              <ChatAutoCompleteInput
                ref={chatInputRef}
                value={messageInput}
                onChangeText={setMessageInput}
                onEmoteSelect={emote => {
                  setMessageInput(
                    prev =>
                      `${prev}${prev.length > 0 ? ' ' : ''}${emote.name} `,
                  );
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={
                  replyTo
                    ? `Reply to ${replyTo.username}...`
                    : 'Send a message...'
                }
                editable
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#666"
                onSubmitEditing={() => void handleSendMessage()}
                returnKeyType="send"
                prioritizeChannelEmotes
              />
            </View>

            {/* Debug Button (Dev only) */}
            {__DEV__ && (
              <Button
                style={styles.inputActionButton}
                onPress={() => debugModalRef.current?.present()}
                hitSlop={createHitslop(20)}
              >
                <Icon icon="zap" size={20} />
              </Button>
            )}

            {/* Send Button */}
            <Button
              style={[
                styles.sendButton,
                (!messageInput.trim() || !connected) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={() => void handleSendMessage()}
              disabled={!messageInput.trim() || !connected}
              hitSlop={createHitslop(20)}
            >
              <Icon
                icon="arrow-up"
                size={20}
                color={messageInput.trim() && connected ? '#fff' : undefined}
              />
            </Button>
          </View>
        </View>

        {/* Emote Sheet */}
        {connected && (
          <EmoteSheet ref={emoteSheetRef} onEmoteSelect={handleEmoteSelect} />
        )}
        <BottomSheetModal
          ref={debugModalRef}
          backgroundStyle={styles.debugModalBackground}
          handleIndicatorStyle={styles.debugModalHandle}
          enablePanDownToClose
          snapPoints={['50%']}
        >
          <BottomSheetView style={styles.debugModalContent}>
            <View style={styles.debugModalHeader}>
              <Typography fontWeight="bold" style={styles.debugModalTitle}>
                Debug Test Messages
              </Typography>
            </View>
            <Button
              onPress={() => {
                handleTestMessageSelect('Prime Sub');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Prime Sub</Typography>
            </Button>
            <Button
              onPress={() => {
                handleTestMessageSelect('Tier 1 Sub');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Tier 1 Sub</Typography>
            </Button>
            <Button
              onPress={() => {
                handleTestMessageSelect('Tier 2 Sub');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Tier 2 Sub</Typography>
            </Button>
            <Button
              onPress={() => {
                handleTestMessageSelect('Tier 3 Sub');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Tier 3 Sub</Typography>
            </Button>
            <Button
              onPress={() => {
                handleTestMessageSelect('Default Sub');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Default Sub</Typography>
            </Button>
            <Button
              onPress={() => {
                handleTestMessageSelect('Viewer Milestone');
                debugModalRef.current?.dismiss();
              }}
              style={styles.debugModalItem}
            >
              <Typography>Viewer Milestone</Typography>
            </Button>
            <Button
              onPress={handleClearChatCache}
              style={styles.debugModalItem}
            >
              <Typography>Clear Chat Cache</Typography>
            </Button>
            <Button
              onPress={() => void handleClearImageCache()}
              style={styles.debugModalItem}
            >
              <Typography>Clear Image Cache</Typography>
            </Button>
          </BottomSheetView>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </View>
  );
});

Chat.displayName = 'Chat';

const styles = StyleSheet.create(theme => ({
  wrapper: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  debugModalBackground: {
    backgroundColor: theme.colors.black.bgAlpha,
  },
  debugModalHandle: {
    backgroundColor: theme.colors.gray.accent,
    width: 36,
    height: 4,
    borderRadius: theme.radii.full,
  },
  debugModalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  debugModalHeader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  debugModalTitle: {
    fontSize: theme.font.fontSize.lg,
  },
  debugModalItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.border,
    backgroundColor: theme.colors.accent.bgAlt,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  inputFieldContainer: {
    flex: 1,
  },
  inputActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.violet.accent,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray.ui,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accent.ui,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.border,
  },
  replyIndicator: {
    width: 3,
    height: '100%',
    minHeight: 32,
    backgroundColor: theme.colors.violet.accent,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  replyLabel: {
    fontSize: theme.font.fontSize.xs,
    opacity: 0.7,
  },
  replyUsername: {
    fontWeight: '600',
    opacity: 1,
  },
  replyMessagePreview: {
    fontSize: theme.font.fontSize.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  replyDismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  dropdownContent: {
    minWidth: 180,
    backgroundColor: '#1f1f1f',
    borderRadius: theme.radii.md,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    marginHorizontal: theme.spacing.sm,
  },
  header: {
    padding: theme.spacing.md,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    minHeight: 50,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  pausedText: {
    color: 'white',
    marginBottom: theme.spacing.md,
  },
  replyContent: {
    flex: 1,
  },
}));
