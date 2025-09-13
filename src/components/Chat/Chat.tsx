/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useChatContext } from '@app/context/ChatContext';
import { useAppNavigation } from '@app/hooks';
import TmiService from '@app/services/tmi-service';
import { ChatMessageType } from '@app/store';
import { createHitslop, clearImageCache } from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
import { replaceTextWithEmotes } from '@app/utils/chat/replaceTextWithEmotes';
import { logger } from '@app/utils/logger';
import { generateNonce } from '@app/utils/string/generateNonce';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LegendListRef, LegendListRenderItemProps } from '@legendapp/list';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

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
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const hasPartedRef = useRef<boolean>(false);
  const [client, setClient] = useState<tmijs.Client | null>(null);
  const initializingRef = useRef<boolean>(false);
  const initializedChannelRef = useRef<string | null>(null); // Track which channel we've initialized

  const {
    loadChannelResources,
    clearChannelResources,
    loadingState,
    clearTtvUsers,
    addMessage,
    clearMessages,
    getCurrentEmoteData,
  } = useChatContext();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      console.log('🚪 Screen is being removed, cleaning up chat connection...');

      // Part the channel if we haven't already
      if (client && !hasPartedRef.current) {
        hasPartedRef.current = true;
        console.log(`👋 Parting channel: ${channelName}`);
        void client.part(channelName);
      }

      // Clean up listeners
      if (client) {
        console.log('🧹 Removing all TMI listeners');
        client.removeAllListeners('message');
        client.removeAllListeners('clearchat');
        client.removeAllListeners('disconnected');
        client.removeAllListeners('connected');
      }

      // Reset connection state
      setConnected(false);
      setClient(null);

      // Reset initialization tracking
      initializedChannelRef.current = null;
      initializingRef.current = false;
    });

    return () => {
      unsubscribe();
      // Only clear resources when component unmounts
      clearChannelResources();
      clearTtvUsers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, client, channelName]); // Add client and channelName as dependencies

  const legendListRef = useRef<LegendListRef>(null);
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

  const BOTTOM_THRESHOLD = 50; // Increase threshold for better detection
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const isAtBottomRef = useRef<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isScrollingToBottom, setIsScrollingToBottom] =
    useState<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      // Clear any existing timeout when user scrolls
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
    // More aggressive auto-scrolling for fast chats
    if (isAtBottomRef.current) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        // Use scrollToEnd for better performance in fast chats
        legendListRef.current?.scrollToEnd({ animated: false });
      }
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    setIsScrollingToBottom(true);
    const lastIndex = messages.length - 1;

    if (lastIndex >= 0) {
      // Use scrollToEnd for more reliable scrolling
      legendListRef.current?.scrollToEnd({ animated: true });
    }

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Shorter timeout for faster response
    scrollTimeoutRef.current = setTimeout(() => {
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnreadCount(0);
      setIsScrollingToBottom(false);
      scrollTimeoutRef.current = null;
    }, 100); // Reduced from 300ms to 100ms
  }, [messages.length]);

  // Add cleanup for timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleNewMessage = useCallback(
    (newMessage: ChatMessageType) => {
      addMessage(newMessage);

      const updatedMessages = [...messagesRef.current, newMessage].slice(-250);
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      // Only increment unread count if user is not at bottom and not auto-scrolling
      if (!isAtBottomRef.current && !isScrollingToBottom) {
        setUnreadCount(prev => prev + 1);
      }

      // Force scroll to bottom if we're already at bottom (for fast chats)
      if (isAtBottomRef.current && !isScrollingToBottom) {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          legendListRef.current?.scrollToEnd({ animated: false });
        });
      }
    },
    [addMessage, isScrollingToBottom],
  );

  const setupChatListeners = useCallback(
    (tmiClient: tmijs.Client) => {
      // Remove existing listeners first to prevent duplicates
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

        /**
         * Use the getCurrentEmoteData function from the context hook
         * that was already destructured at the top of the component
         */
        const currentEmotes = getCurrentEmoteData(channelId);

        // console.log('🐛 getCurrentEmoteData returned:', {
        //   twitchChannelCount: currentEmotes.twitchChannelEmotes.length,
        //   twitchGlobalCount: currentEmotes.twitchGlobalEmotes.length,
        //   sevenTvChannelCount: currentEmotes.sevenTvChannelEmotes.length,
        //   sevenTvGlobalCount: currentEmotes.sevenTvGlobalEmotes.length,
        //   totalEmotes:
        //     currentEmotes.twitchChannelEmotes.length +
        //     currentEmotes.twitchGlobalEmotes.length +
        //     currentEmotes.sevenTvChannelEmotes.length +
        //     currentEmotes.sevenTvGlobalEmotes.length +
        //     currentEmotes.ffzChannelEmotes.length +
        //     currentEmotes.ffzGlobalEmotes.length +
        //     currentEmotes.bttvChannelEmotes.length +
        //     currentEmotes.bttvGlobalEmotes.length,
        // });

        const replacedMessage = replaceTextWithEmotes({
          bttvChannelEmotes: currentEmotes.bttvChannelEmotes,
          bttvGlobalEmotes: currentEmotes.bttvGlobalEmotes,
          ffzChannelEmotes: currentEmotes.ffzChannelEmotes,
          ffzGlobalEmotes: currentEmotes.ffzGlobalEmotes,
          inputString: text.trimEnd(),
          sevenTvChannelEmotes: currentEmotes.sevenTvChannelEmotes,
          sevenTvGlobalEmotes: currentEmotes.sevenTvGlobalEmotes,
          twitchChannelEmotes: currentEmotes.twitchChannelEmotes,
          twitchGlobalEmotes: currentEmotes.twitchGlobalEmotes,
          userstate,
        });

        const replacedBadges = findBadges({
          userstate,
          chatterinoBadges: currentEmotes.chatterinoBadges,
          chatUsers: [], // need to populate from ctx
          ffzChannelBadges: currentEmotes.ffzChannelBadges,
          ffzGlobalBadges: currentEmotes.ffzGlobalBadges,
          twitchChannelBadges: currentEmotes.twitchChannelBadges,
          twitchGlobalBadges: currentEmotes.twitchGlobalBadges,
        });

        const newMessage: ChatMessageType = {
          userstate,
          message: replacedMessage,
          badges: replacedBadges,
          channel: channelName,
          message_id,
          message_nonce,
          sender: userstate.username || '',
          parentDisplayName:
            (tags['reply-parent-display-name'] as string) || '',
          replyDisplayName: (tags['reply-parent-user-login'] as string) || '',
          replyBody: (tags['reply-parent-msg-body'] as string) || '',
        };

        handleNewMessage(newMessage);
      });

      tmiClient.on('clearchat', () => {
        messagesRef.current = [];
        clearMessages();
        setTimeout(() => {
          legendListRef.current?.scrollToEnd({ animated: false });
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
    [
      channelName,
      handleNewMessage,
      clearMessages,
      channelId,
      getCurrentEmoteData, // Add this back since we're using it directly
    ],
  );

  // Add an effect to wait for emote data to be available before setting up listeners
  useEffect(() => {
    const checkEmoteDataAndSetupListeners = () => {
      if (!client || !channelId) return;

      // Check if emote data is actually available
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
        // If loading is completed but we still don't have emotes, try again in a bit
        console.log(
          '⏳ Loading completed but no emotes yet, retrying in 100ms...',
        );
        setTimeout(() => {
          checkEmoteDataAndSetupListeners();
        }, 100);
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

  // Update the cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup listeners when component unmounts or channel changes
      if (client) {
        console.log('🧹 Cleaning up chat listeners (useEffect cleanup)');

        // Part the channel if we haven't already
        if (!hasPartedRef.current) {
          hasPartedRef.current = true;
          console.log(`👋 Parting channel: ${channelName} (cleanup)`);
          void client.part(channelName);
        }

        // Remove all listeners
        client.removeAllListeners('message');
        client.removeAllListeners('clearchat');
        client.removeAllListeners('disconnected');
        client.removeAllListeners('connected');
      }

      // Reset states
      setConnected(false);
      setMessages([]);
      messagesRef.current = [];
    };
  }, [client, channelId, channelName]);

  // Simpler approach - just track if we've initialized this specific channel
  useEffect(() => {
    const initializeChat = async () => {
      // Prevent multiple simultaneous initializations
      if (initializingRef.current) {
        console.log('⏸️ Already initializing, skipping...');
        return;
      }

      // Check if we've already initialized this channel
      if (initializedChannelRef.current === channelId) {
        console.log('⏸️ Already initialized for this channel:', channelId);
        return;
      }

      try {
        initializingRef.current = true;
        console.log('🔄 initializeChat starting for:', channelId);

        // Load channel resources first
        logger.chat.info(`Loading resources for channel ${channelId}`);
        console.log('📡 About to call loadChannelResources...');

        const success = await loadChannelResources(channelId);

        console.log('📡 loadChannelResources result:', success);

        if (!success) {
          console.log('❌ loadChannelResources failed');
          setConnectionError('Failed to load channel resources');
          return;
        }

        console.log('✅ loadChannelResources succeeded, setting up TMI...');

        if (TmiService.isConnected()) {
          console.log('🔗 TMI already connected, reusing connection');
          const existingClient = TmiService.getInstance();
          setClient(existingClient);
          // Remove setupChatListeners from here - it will be called by the useEffect above
          // setupChatListeners(existingClient);
          setConnected(true);
          await existingClient.join(channelName);
          console.log('🎉 Chat initialization complete (reused connection)!');
          initializedChannelRef.current = channelId;
          return;
        }

        // Set up TMI service options
        TmiService.setOptions({
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

        const tmiClient = TmiService.getInstance();
        setClient(tmiClient);

        // Remove setupChatListeners from here too - it will be called by the useEffect above
        // setupChatListeners(tmiClient);

        // Connect and join
        await TmiService.connect();
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

    // Simple check - just need channelId and auth token
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

    // Reset initialization tracking when channel changes
    return () => {
      if (initializedChannelRef.current !== channelId) {
        initializedChannelRef.current = null;
      }
    };
  }, [
    channelId, // Only depend on channelId, not currentChannelId
    loadChannelResources,
    setupChatListeners,
    channelName,
    authState?.token.accessToken, // Add this back since we need it
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
    ({ item }: LegendListRenderItemProps<ChatMessageType>) => (
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
            message: message.message.map(part => part.content).join(''),
            replyParentUserLogin: message.userstate.username || '',
          });
        }}
        replyDisplayName={item.replyDisplayName}
        replyBody={item.replyBody}
      />
    ),
    [],
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
          <AnimatedLegendList
            data={messages}
            ref={legendListRef}
            keyExtractor={item => `${item.message_id}_${item.message_nonce}`}
            recycleItems
            waitForInitialLayout={false}
            estimatedItemSize={80}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
          />
          {!isAtBottom && !isScrollingToBottom && (
            <ResumeScroll
              isAtBottomRef={isAtBottomRef}
              legendListRef={legendListRef}
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
  },
  input: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    color: '#efeff1',
    marginRight: theme.spacing.md,
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
    // borderTopColor: theme.colors.border,
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
