/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { ChatMessageType, useChatContext } from '@app/context/ChatContext';
import { useAppNavigation, useSeventvWs, useTwitchWs } from '@app/hooks';
import { useEmoteProcessor } from '@app/hooks/useEmoteProcessor';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import {
  UserNoticeVariantMap,
  UserNoticeTagsByVariant,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { createHitslop, clearImageCache } from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { logger } from '@app/utils/logger';
import { generateNonce } from '@app/utils/string/generateNonce';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashListRef } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { ChatAutoCompleteInput } from '../ChatAutoCompleteInput';
import { FlashList } from '../FlashList';
import { Icon } from '../Icon';
import { SafeAreaViewFixed } from '../SafeAreaViewFixed';
import { Typography } from '../Typography';
import { ChatSkeleton, ChatMessage, ResumeScroll } from './components';
import { EmojiPickerSheet, PickerItem } from './components/EmojiPickerSheet';

// Union type representing all possible ChatMessageType variants
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
  const { authState } = useAuthContext();
  const navigation = useAppNavigation();
  const hasPartedRef = useRef<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const initializedChannelRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isNavigatingAwayRef = useRef<boolean>(false);
  const loadingAbortRef = useRef<AbortController | null>(null);

  const currentEmoteSetIdRef = useRef<string | null>(null);

  const {
    loadChannelResources,
    clearChannelResources,
    loadingState,
    clearTtvUsers,
    addMessage,
    addMessages,
    clearMessages,
    getCurrentEmoteData,
    getSevenTvEmoteSetId,
    messages,
  } = useChatContext();

  const sevenTvEmoteSetId = useMemo(() => {
    return getSevenTvEmoteSetId(channelId) || undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useTwitchWs();

  // Initialize emote processor with current emote data
  const currentEmotes = getCurrentEmoteData(channelId);
  const emoteProcessor = useEmoteProcessor({
    sevenTvGlobalEmotes: currentEmotes?.sevenTvGlobalEmotes || [],
    sevenTvChannelEmotes: currentEmotes?.sevenTvChannelEmotes || [],
    twitchGlobalEmotes: currentEmotes?.twitchGlobalEmotes || [],
    twitchChannelEmotes: currentEmotes?.twitchChannelEmotes || [],
    ffzChannelEmotes: currentEmotes?.ffzChannelEmotes || [],
    ffzGlobalEmotes: currentEmotes?.ffzGlobalEmotes || [],
    bttvChannelEmotes: currentEmotes?.bttvChannelEmotes || [],
    bttvGlobalEmotes: currentEmotes?.bttvGlobalEmotes || [],
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

    // Use addMessages for batch processing instead of individual addMessage calls
    addMessages(batch as ChatMessageType<never>[]);

    messagesRef.current = [...messagesRef.current, ...batch].slice(-500);

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
  }, [addMessages, isScrollingToBottom, messages.length]);

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
              message => message.message_id === replyParentMessageId,
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
            message => message.message_id === replyParentMessageId,
          );

          if (replyParent) {
            setReplyTo({
              messageId: replyParentMessageId,
              username: replyParentDisplayName || '',
              message: replyParentMessageBody || '',
              replyParentUserLogin: replyParentUserLogin || '',
            });
          }
        }

        const message_nonce = generateNonce();

        const emoteData = getCurrentEmoteData(channelId);

        const msgId = tags['msg-id'];

        const isValidVariant = (
          id?: string,
        ): id is keyof UserNoticeVariantMap => {
          return (
            id !== undefined &&
            (id === 'viewermilestone' ||
              id === 'sub' ||
              id === 'resub' ||
              id === 'subgift' ||
              id === 'anongiftpaidupgrade' ||
              id === 'raid')
          );
        };

        // Narrow the type based on msg-id if it's a known usernotice variant
        // When msg-id is 'viewermilestone', notice_tags will be narrowed to ViewerMilestoneTags
        // When msg-id is 'sub', notice_tags will be narrowed to SubscriptionTags, etc.
        let newMessage: AnyChatMessageType;
        if (isValidVariant(msgId)) {
          // Base message fields shared across all variants
          const baseMessage = {
            userstate,
            message: [{ type: 'text' as const, content: text.trimEnd() }],
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

          /**
           * Narrow the msg id so we can match up notice_tags with the correct
           */
          switch (msgId) {
            case 'viewermilestone': {
              const viewerMilestoneTags =
                tags as UserNoticeTagsByVariant<'viewermilestone'>;

              const viewerMilestoneMessage: ChatMessageType<
                'usernotice',
                'viewermilestone'
              > = {
                ...baseMessage,
                notice_tags: {
                  'msg-id': viewerMilestoneTags['msg-id'],
                  'msg-param-category':
                    viewerMilestoneTags['msg-param-category'],
                  'msg-param-copoReward':
                    viewerMilestoneTags['msg-param-copoReward'] ?? '',
                  'msg-param-id': viewerMilestoneTags['msg-param-id'] ?? '',
                  'msg-param-value':
                    viewerMilestoneTags['msg-param-value'] ?? '',
                  'badge-info': viewerMilestoneTags['badge-info'] ?? '',
                  'display-name': viewerMilestoneTags['display-name'] ?? '',
                } satisfies UserNoticeTagsByVariant<'viewermilestone'>,
              };
              newMessage = viewerMilestoneMessage;
              handleNewMessage(viewerMilestoneMessage);
              break;
            }
            case 'sub': {
              const subTags = tags as UserNoticeTagsByVariant<'sub'>;

              const subMessage: ChatMessageType<'usernotice', 'sub'> = {
                ...baseMessage,
                notice_tags: subTags,
              };
              newMessage = subMessage;
              handleNewMessage(subMessage);
              break;
            }
            case 'resub': {
              const resubTags = tags as UserNoticeTagsByVariant<'resub'>;

              const resubMessage: ChatMessageType<'usernotice', 'resub'> = {
                ...baseMessage,
                notice_tags: resubTags,
              };
              newMessage = resubMessage;
              handleNewMessage(resubMessage);
              break;
            }
            case 'subgift': {
              const subGiftTags = tags as UserNoticeTagsByVariant<'subgift'>;

              const subGiftMessage: ChatMessageType<'usernotice', 'subgift'> = {
                ...baseMessage,
                notice_tags: subGiftTags,
              };
              newMessage = subGiftMessage;
              handleNewMessage(subGiftMessage);
              break;
            }
            case 'anongiftpaidupgrade': {
              const anonGiftPaidUpgradeTags =
                tags as UserNoticeTagsByVariant<'anongiftpaidupgrade'>;

              const anonGiftPaidUpgradeMessage: ChatMessageType<
                'usernotice',
                'anongiftpaidupgrade'
              > = {
                ...baseMessage,
                notice_tags: anonGiftPaidUpgradeTags,
              };
              newMessage = anonGiftPaidUpgradeMessage;
              handleNewMessage(anonGiftPaidUpgradeMessage);
              break;
            }
            case 'raid': {
              const raidTags = tags as UserNoticeTagsByVariant<'raid'>;

              const raidMessage: ChatMessageType<'usernotice', 'raid'> = {
                ...baseMessage,
                notice_tags: raidTags,
              };
              newMessage = raidMessage;
              handleNewMessage(raidMessage);
              break;
            }
            default: {
              const fallbackMessage: ChatMessageType<'usernotice'> = {
                ...baseMessage,
              };
              newMessage = fallbackMessage;
              handleNewMessage(newMessage);
            }
          }
        } else {
          const fallbackMessage: ChatMessageType<'usernotice'> = {
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
          newMessage = fallbackMessage;
          handleNewMessage(newMessage);
        }

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

                addMessage(updatedMessage as ChatMessageType<'usernotice'>);
              } catch (error) {
                logger.chat.error('Error processing emotes:', error);
              }
            },
          );
        }
      },
      [
        channelId,
        channelName,
        getCurrentEmoteData,
        emoteProcessor,
        handleNewMessage,
        addMessage,
        messages,
      ],
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
    }, [clearMessages, messages.length]),
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
    }, [channelName, addMessage]),

    onPart: useCallback(() => {
      logger.chat.info('Parted from channel:', channelName);
      clearMessages();
      messagesRef.current = [];
    }, [channelName, clearMessages]),
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
        console.log(`SevenTV event: ${eventType}`, data);
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
  }, [
    wsConnected,
    channelId,
    loadingState,
    subscribeToChannel,
    getSevenTvEmoteSetId,
  ]);

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
  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);

  const [messageInput, setMessageInput] = useState<string>('');

  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    username: string;
    message: string;
    replyParentUserLogin: string;
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
    messagesRef.current = messages;
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
      // Cleanup on unmount or channel change
      isMountedRef.current = false;
      hasPartedRef.current = false;
      currentEmoteSetIdRef.current = null;
      // Clear timeouts on cleanup
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [channelId, clearMessages]);

  // Initialize channel resources when channelId changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, authState?.token.accessToken]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !isChatConnected()) {
      return;
    }

    if (replyTo) {
      try {
        sendMessage(
          channelName,
          `@${replyTo.username} ${messageInput}`,
          replyTo.messageId,
          replyTo.username,
          replyTo.message,
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, messageInput);
    }

    setMessageInput('');
    setReplyTo(null);
  }, [channelName, messageInput, replyTo, sendMessage, isChatConnected]);

  const inputContainerRef = useRef<View>(null);
  const [_inputContainerHeight, setInputContainerHeight] = useState(0);

  const measureInputContainer = useCallback(() => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measure((_x, _y, _width, height) => {
        setInputContainerHeight(height);
      });
    }
  }, []);

  const handleReply = useCallback((message: ChatMessageType<'usernotice'>) => {
    setReplyTo({
      messageId: message.message_id,
      username: message.sender,
      message: message.message
        .map(part => (part as { content: string }).content)
        .join(''),
      replyParentUserLogin: message.userstate.username || '',
    });
  }, []);

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
      />
    ),
    [handleReply],
  );

  const emojiPickerRef = useRef<BottomSheetModal>(null);

  const handleEmojiPickerToggle = useCallback(() => {
    if (showEmotePicker) {
      emojiPickerRef.current?.dismiss();
    } else {
      emojiPickerRef.current?.present();
    }
    setShowEmotePicker(!showEmotePicker);
  }, [showEmotePicker]);

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
    setShowEmotePicker(false);
  }, []);

  const handleClearImageCache = useCallback(async () => {
    try {
      await clearImageCache(channelId);
      logger.chat.info('Image cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear image cache:', error);
    }
  }, [channelId]);

  // Show skeleton only if loading and not navigating away
  // This prevents the skeleton from blocking navigation
  if (loadingState === 'LOADING' && !isNavigatingAwayRef.current) {
    return <ChatSkeleton />;
  }

  if (loadingState === 'ERROR') {
    // log to sentry
  }

  return (
    <SafeAreaViewFixed style={styles.safeArea}>
      <Typography style={styles.header}>CHAT</Typography>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={[
            styles.chatContainer,
            {
              flex: 1,
              width: '100%',
              overflow: 'hidden',
              maxWidth: '100%',
            },
          ]}
        >
          <FlashList
            data={messages}
            ref={flashListRef}
            keyExtractor={item => {
              const baseKey = `${item.message_id}_${item.message_nonce}`;
              const additionalUniqueness = `${item.sender}_${item.channel}`;
              return `${baseKey}_${additionalUniqueness}`;
            }}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
            removeClippedSubviews
            drawDistance={500} // Increased for better performance
            overrideItemLayout={(layout, item) => {
              const messageLength = item.message?.length || 0;
              const estimatedHeight = Math.max(
                60,
                Math.min(120, 60 + messageLength * 0.5),
              );
              // eslint-disable-next-line no-param-reassign
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
          style={[styles.inputContainer, { zIndex: 2 }]}
          onLayout={measureInputContainer}
        >
          {replyTo && (
            <View style={styles.replyContainer}>
              <Typography style={styles.replyText}>
                Replying to {replyTo.username}
              </Typography>
              <Button
                style={styles.cancelReplyButton}
                onPress={() => setReplyTo(null)}
              >
                <Icon icon="x" size={16} />
              </Button>
            </View>
          )}
          <Button
            style={styles.sendButton}
            onPress={handleEmojiPickerToggle}
            hitSlop={createHitslop(40)}
          >
            <Icon icon="smile" size={24} />
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
      </KeyboardAvoidingView>
    </SafeAreaViewFixed>
  );
});

Chat.displayName = 'Chat';

const styles = StyleSheet.create(theme => ({
  safeArea: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
    position: 'relative',
    borderCurve: 'continuous',
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
  replyText: {
    flex: 1,
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
