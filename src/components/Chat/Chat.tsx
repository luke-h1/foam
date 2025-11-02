/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { ChatMessageType, useChatContext } from '@app/context/ChatContext';
import { useAppNavigation, useSeventvWs } from '@app/hooks';
import { useEmoteProcessor } from '@app/hooks/useEmoteProcessor';
import {
  getTmiClient,
  isTmiClientConnected,
  connectTmiClient,
  setTmiClientOptions,
} from '@app/hooks/useTmiClient';
import { createHitslop, clearImageCache } from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
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
import tmijs from 'tmi.js';
import { Button } from '../Button';
import { ChatAutoCompleteInput } from '../ChatAutoCompleteInput';
import { FlashList } from '../FlashList';
import { Icon } from '../Icon';
import { SafeAreaViewFixed } from '../SafeAreaViewFixed';
import { Typography } from '../Typography';
import { ChatSkeleton, ChatMessage, ResumeScroll } from './components';
import { EmojiPickerSheet, PickerItem } from './components/EmojiPickerSheet';

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const [connected, setConnected] = useState<boolean>(false);
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const hasPartedRef = useRef<boolean>(false);
  const [client, setClient] = useState<tmijs.Client | null>(null);
  const initializingRef = useRef<boolean>(false);
  const initializedChannelRef = useRef<string | null>(null);

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

  const { subscribeToChannel, unsubscribeFromChannel, isConnected } =
    useSeventvWs({
      // eslint-disable-next-line no-shadow
      onEmoteUpdate: ({ added, removed, channelId }) => {
        logger.stvWs.info(
          `Channel ${channelId}: +${added.length} -${removed.length} emotes`,
        );

        // updateSevenTvEmotes(channelId, added, removed);
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

      if (client && !hasPartedRef.current) {
        hasPartedRef.current = true;
        console.log(`👋 Parting channel: ${channelName}`);
        void client.part(channelName);
      }

      if (client) {
        console.log('🧹 Removing all TMI listeners');
        client.removeAllListeners('message');
        client.removeAllListeners('clearchat');
        client.removeAllListeners('disconnected');
        client.removeAllListeners('connected');
      }

      setConnected(false);
      setClient(null);

      initializedChannelRef.current = null;
      initializingRef.current = false;
    });

    return () => {
      unsubscribe();
      clearChannelResources();
      clearTtvUsers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, client, channelName]);

  const flashListRef = useRef<FlashListRef<ChatMessageType>>(null);
  const messagesRef = useRef<ChatMessageType[]>([]);

  const [_connectionError, setConnectionError] = useState<string | null>(null);
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
  const isAtBottomRef = useRef<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isScrollingToBottom, setIsScrollingToBottom] =
    useState<boolean>(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messageBatchRef = useRef<ChatMessageType[]>([]);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const processMessageBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0) return;

    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];

    // Use addMessages for batch processing instead of individual addMessage calls
    addMessages(batch);

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
    (newMessage: ChatMessageType) => {
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

  const setupChatListeners = useCallback(
    (tmiClient: tmijs.Client) => {
      tmiClient.removeAllListeners('message');
      tmiClient.removeAllListeners('clearchat');
      tmiClient.removeAllListeners('disconnected');
      tmiClient.removeAllListeners('connected');

      console.log('🎧 Setting up fresh chat listeners');

      tmiClient.on('message', (_channel, tags, text, _self) => {
        const userstate = tags;

        const message_id = userstate.id || '0';
        const replyParentMessageId = tags.id;

        const replyParentDisplayName = tags[
          'reply-parent-display-name'
        ] as string;

        const replyParentUserLogin = tags['reply-parent-user-login'] as string;
        const replyParentMessageBody = tags['reply-parent-msg-body'] as string;

        if (replyParentMessageId) {
          const replyParent = messages.find(
            message => message.message_id === replyParentMessageId,
          );

          if (replyParent) {
            setReplyTo({
              messageId: replyParentMessageId,
              username: replyParentDisplayName,
              message: replyParentMessageBody,
              replyParentUserLogin,
            });
          }
        }

        const message_nonce = generateNonce();

        const emoteData = getCurrentEmoteData(channelId);

        // Create message immediately with basic text, defer emote/badge processing
        const newMessage: ChatMessageType = {
          userstate,
          message: [{ type: 'text', content: text.trimEnd() }],
          badges: [],
          channel: channelName,
          message_id,
          message_nonce,
          sender: userstate.username || '',
          parentDisplayName:
            (tags['reply-parent-display-name'] as string) || '',
          replyDisplayName: (tags['reply-parent-user-login'] as string) || '',
          replyBody: (tags['reply-parent-msg-body'] as string) || '',
        };

        // Send message immediately for fast rendering
        handleNewMessage(newMessage);

        // Process emotes and badges asynchronously using worklet
        if (
          emoteData &&
          (emoteData.twitchGlobalEmotes.length > 0 ||
            emoteData.sevenTvGlobalEmotes.length > 0 ||
            emoteData.bttvGlobalEmotes.length > 0 ||
            emoteData.ffzGlobalEmotes.length > 0)
        ) {
          // Use worklet-based emote processor for better concurrency
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

                // Update the message with processed emotes and badges
                const updatedMessage: ChatMessageType = {
                  ...newMessage,
                  message: replacedMessage,
                  badges: replacedBadges,
                };

                // Update the message in the context
                addMessage(updatedMessage);
              } catch (error) {
                logger.chat.error('Error processing emotes:', error);
              }
            },
          );
        }
      });

      tmiClient.on('clearchat', () => {
        clearMessages(); // This will clear messages in context
        messagesRef.current = [];
        setTimeout(() => {
          void flashListRef.current?.scrollToIndex({
            index: messages.length - 1,
            animated: false,
          });
        }, 0);
        void tmiClient.say(channelName, 'Chat cleared by moderator');
      });

      tmiClient.on('disconnected', reason => {
        logger.chat.info('Disconnected from chat:', reason);
        setConnected(false);
      });

      tmiClient.on('connected', () => {
        setConnected(true);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelName,
      handleNewMessage,
      clearMessages,
      channelId,
      getCurrentEmoteData,
    ],
  );

  // Add an effect to wait for emote data to be available before setting up listeners
  useEffect(() => {
    const checkEmoteDataAndSetupListeners = () => {
      if (!client || !channelId) return;

      const emoteData = getCurrentEmoteData(channelId);

      const hasEmotes =
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0;

      if (hasEmotes) {
        console.log('🎧 Emote data is available, setting up chat listeners');
        setupChatListeners(client);
      } else if (loadingState === 'COMPLETED') {
        console.log(
          '⏳ Loading completed but no emotes yet, retrying in 200ms...',
        );
        setTimeout(() => {
          checkEmoteDataAndSetupListeners();
        }, 200);
      }
    };

    checkEmoteDataAndSetupListeners();
  }, [
    client,
    channelId,
    loadingState,
    getCurrentEmoteData,
    setupChatListeners,
  ]);

  useEffect(() => {
    return () => {
      if (client) {
        console.log('🧹 Cleaning up chat listeners (useEffect cleanup)');

        if (!hasPartedRef.current) {
          hasPartedRef.current = true;
          console.log(`👋 Parting channel: ${channelName} (cleanup)`);
          void client.part(channelName);
        }

        client.removeAllListeners('message');
        client.removeAllListeners('clearchat');
        client.removeAllListeners('disconnected');
        client.removeAllListeners('connected');
      }

      setConnected(false);
      clearMessages();
      messagesRef.current = [];
    };
  }, [client, channelId, channelName, clearMessages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (initializingRef.current) {
        console.log('⏸️ Already initializing, skipping...');
        return;
      }

      if (initializedChannelRef.current === channelId) {
        console.log('⏸️ Already initialized for this channel:', channelId);
        return;
      }

      try {
        initializingRef.current = true;
        console.log('🔄 initializeChat starting for:', channelId);

        void loadChannelResources(channelId).then(success => {
          console.log('📡 loadChannelResources result (background):', success);
          if (!success) {
            console.log('❌ loadChannelResources failed (background)');
          }
        });

        console.log('🚀 Connecting to TMI immediately...');

        if (isTmiClientConnected()) {
          console.log('🔗 TMI already connected, reusing connection');
          const existingClient = getTmiClient();
          if (existingClient) {
            setClient(existingClient);
            setConnected(true);
            await existingClient.join(channelName);
            console.log('🎉 Chat initialization complete (reused connection)!');
            initializedChannelRef.current = channelId;
            return;
          }
        }

        setTmiClientOptions({
          options: {
            clientId: process.env.TWITCH_CLIENT_ID,
            debug: __DEV__,
          },
          channels: [],
          identity: user
            ? {
                username: user.display_name ?? '',
                password: authState?.token.accessToken,
              }
            : undefined,
          connection: {
            secure: true,
            reconnect: true,
            maxReconnectAttempts: 5,
            maxReconnectInterval: 30000,
            reconnectDecay: 1.5,
            reconnectInterval: 1000,
          },
        });

        const tmiClient = getTmiClient();
        if (!tmiClient) {
          throw new Error('Failed to get TMI client instance');
        }
        setClient(tmiClient);

        await connectTmiClient();
        setConnected(true);
        await tmiClient.join(channelName);

        console.log('🎉 Chat initialization complete!');
        initializedChannelRef.current = channelId;
      } catch (error) {
        console.log('💥 Chat initialization error:', error);
        logger.chat.error('Failed to initialize chat:', error);
        setConnectionError('Failed to connect to chat');
        setConnected(false);
      } finally {
        initializingRef.current = false;
      }
    };

    if (channelId && channelId.trim() && authState?.token.accessToken) {
      console.log('🚀 Initializing chat for:', {
        channelId,
        hasUser: !!user,
        hasAuthState: !!authState,
        alreadyInitialized: initializedChannelRef.current === channelId,
      });
      void initializeChat();
    } else {
      console.log('⏸️ Skipping initialization:', {
        channelId,
        hasUser: !!user,
        hasAuthToken: !!authState?.token.accessToken,
      });
    }

    return () => {
      if (initializedChannelRef.current !== channelId) {
        initializedChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelId,
    setupChatListeners,
    channelName,
    authState?.token.accessToken,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !client) {
      return;
    }

    if (replyTo) {
      try {
        await client.say(
          channelName,
          `@${replyTo.username} ${messageInput}`,
          // @ts-expect-error - upstream types in tmi.js are not up to date
          {
            'reply-parent-msg-id': replyTo.messageId,
            'reply-parent-display-name': replyTo.username,
            'reply-parent-msg-body': replyTo.message,
            'reply-parent-user-login': replyTo.replyParentUserLogin,
          },
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      await client.say(channelName, messageInput);
    }

    setMessageInput('');
    setReplyTo(null);
  }, [channelName, client, messageInput, replyTo]);

  const inputContainerRef = useRef<View>(null);
  const [_inputContainerHeight, setInputContainerHeight] = useState(0);

  const measureInputContainer = useCallback(() => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measure((_x, _y, _width, height) => {
        setInputContainerHeight(height);
      });
    }
  }, []);

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: ChatMessageType }) => (
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
        onReply={message => {
          setReplyTo({
            messageId: message.message_id,
            username: message.sender,
            message: message.message
              .map(part => (part as { content: string }).content)
              .join(''),
            replyParentUserLogin: message.userstate.username || '',
          });
        }}
        replyDisplayName={item.replyDisplayName}
        replyBody={item.replyBody}
      />
    ),
    [setReplyTo],
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

  if (loadingState === 'LOADING') {
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
            disabled={!messageInput.trim() || !connected || !client}
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
