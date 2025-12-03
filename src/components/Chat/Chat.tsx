/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useSeventvWs, useTwitchWs } from '@app/hooks';
import { useEmoteProcessor } from '@app/hooks/useEmoteProcessor';
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
} from '@app/store';
import {
  UserNoticeTagsByVariant,
  UserNoticeTags,
  SubscriptionTags,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import {
  createHitslop,
  clearImageCache,
  truncate,
  replaceEmotesWithText,
  ParsedPart,
} from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
import {
  createSubscriptionPart,
  createViewerMilestonePart,
} from '@app/utils/chat/formatSubscriptionNotice';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { logger } from '@app/utils/logger';
import { generateNonce } from '@app/utils/string/generateNonce';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { FlashListRef } from '@shopify/flash-list';
import omit from 'lodash/omit';
import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { ChatAutoCompleteInput } from '../ChatAutoCompleteInput';
import { FlashList } from '../FlashList';
import { Icon } from '../Icon';
import { Typography } from '../Typography';

import { ChatSkeleton, ChatMessage, ResumeScroll } from './components';
import { EmojiPickerSheet, PickerItem } from './components/EmojiPickerSheet';
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

  // Use legend-state hooks and actions
  const loadingState = useLoadingState();
  const messages = useMessages();

  // Actions are imported directly from store

  const sevenTvEmoteSetId = useMemo(() => {
    return getSevenTvEmoteSetId(channelId) || undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelName]),

    onPart: useCallback(() => {
      logger.chat.info('Parted from channel:', channelName);
      clearMessages();
      messagesRef.current = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      onEvent: (eventType, data) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Reset refs on mount and when channelId changes
  useEffect(() => {
    // Reset all refs when component mounts or channel changes
    isMountedRef.current = true;
    isNavigatingAwayRef.current = false;
    hasPartedRef.current = false;
    initializingRef.current = false;
    currentEmoteSetIdRef.current = null;

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

    // Get current user state (color, badges, etc.)
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

    // Process emotes if available and update message when complete
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

  const emojiPickerRef = useRef<BottomSheetModal>(null);
  const debugModalRef = useRef<BottomSheetModal>(null);

  const handleEmojiSelect = useCallback((item: PickerItem) => {
    /**
     * Regular emoji
     */
    if (typeof item === 'string') {
      setMessageInput(prev => `${prev}${' '}${item} `);
    } else {
      /**
       * Third party emote
       */
      setMessageInput(prev => `${prev}${' '}${item.name} `);
    }
    emojiPickerRef.current?.dismiss();
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

  // Show skeleton only if loading and not navigating away
  // This prevents the skeleton from blocking navigation
  if (loadingState === 'LOADING' && !isNavigatingAwayRef.current) {
    return <ChatSkeleton />;
  }

  if (loadingState === 'ERROR') {
    // log to sentry
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <Typography style={styles.header}>CHAT</Typography>
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
          style={styles.inputContainer}
          onLayout={measureInputContainer}
        >
          {replyTo && (
            <View style={styles.replyContainer}>
              <View style={styles.replyContent}>
                <Typography style={styles.replyText}>
                  Replying to {replyTo.username}
                </Typography>
                {replyTo.message && (
                  <Typography style={styles.replyMessageText} numberOfLines={1}>
                    {truncate(replyTo.message.trim() || replyTo.message, 50)}
                  </Typography>
                )}
              </View>
              <Button
                style={styles.cancelReplyButton}
                onPress={() => setReplyTo(null)}
              >
                <Icon icon="x" size={16} />
              </Button>
            </View>
          )}
          {/* <Button
            style={styles.sendButton}
            onPress={handleEmojiPickerToggle}
            hitSlop={createHitslop(40)}
          >
            <Icon icon="smile" size={24} />
          </Button> */}
          <Button
            style={styles.sendButton}
            onPress={() => {
              debugModalRef.current?.present();
            }}
            hitSlop={createHitslop(40)}
          >
            <Icon icon="zap" size={24} />
          </Button>
          <ChatAutoCompleteInput
            value={messageInput}
            onChangeText={setMessageInput}
            onEmoteSelect={emote => {
              setMessageInput(prev => `${prev + emote.name} `);
            }}
            onFocus={() => {
              setIsInputFocused(true);
            }}
            onBlur={() => {
              setIsInputFocused(false);
            }}
            placeholder={
              replyTo ? `Reply to ${replyTo.username}` : 'Send a message'
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
          <Button
            style={styles.clearCacheButton}
            onPress={() => void handleClearImageCache()}
            hitSlop={createHitslop(40)}
          >
            <Icon icon="trash-2" size={20} />
          </Button>
          <Button
            style={styles.sendButton}
            onPress={() => void handleSendMessage()}
            disabled={!messageInput.trim() || !connected}
          >
            <Icon icon="send" size={24} />
          </Button>
        </View>
        {connected && (
          <EmojiPickerSheet
            ref={emojiPickerRef}
            onItemPress={handleEmojiSelect}
          />
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
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
    position: 'relative',
    borderCurve: 'continuous',
    zIndex: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    color: '#efeff1',
    marginRight: theme.spacing.md,
    borderCurve: 'continuous',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.spacing['3xl'],
  },
  clearCacheButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.spacing['2xl'],
    marginRight: theme.spacing.xs,
  },
  debugButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.spacing['2xl'],
    marginRight: theme.spacing.xs,
  },
  dropdownContent: {
    minWidth: 180,
    backgroundColor: '#1f1f1f',
    borderRadius: theme.radii.md,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    // eslint-disable-next-line refined/prefer-box-shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: theme.colors.foregroundInverted,
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderCurve: 'continuous',
  },
  replyContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  replyText: {
    // color: theme.colors.text,
  },
  replyMessageText: {
    marginTop: theme.spacing.xs / 2,
    opacity: 0.7,
    fontSize: theme.font.fontSize.xs,
    // color: theme.colors.text,
  },
  cancelReplyButton: {
    padding: theme.spacing.xs,
  },
  emojiPickerContainer: {
    borderTopWidth: 1,
    // borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    // borderBottomColor: theme.colors.border,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },
}));
