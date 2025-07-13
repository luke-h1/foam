/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { SanitisiedEmoteSet } from '@app/services/seventTvService';
import { ChatMessageType, ChatUser, useChatStore } from '@app/store/chatStore';
import { generateRandomTwitchColor } from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
import { replaceTextWithEmotes } from '@app/utils/chat/replaceTextWithEmotes';
import { logger } from '@app/utils/logger';
import { generateNonce } from '@app/utils/string/generateNonce';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import {
  SafeAreaView,
  View,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { ChatAutoCompleteInput } from '../ChatAutoCompleteInput';
import { EmoteMenuModal } from '../EmoteMenu';
import { Icon } from '../Icon';
import { Typography } from '../Typography';
import { ChatSkeleton, ChatMessage, ResumeScroll } from './components';

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const client = useTmiClient({
    options: {
      clientId: process.env.TWITCH_CLIENT_ID as string,
    },
    channels: [channelName],

    identity: {
      username: user?.display_name ?? '',
      password: authState?.token.accessToken,
    },
  });

  const {
    sevenTvChannelEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvGlobalEmotes,
    loadChannelResources,
    twitchGlobalEmotes,
    clearChannelResources,
    bttvChannelEmotes,
    bttvGlobalEmotes,
    status,
    ttvUsers,
    setTTvUsers,
    twitchChannelBadges,
    twitchGlobalBadges,
    ffzGlobalBadges,
    ffzChannelBadges,
    chatterinoBadges,
    addMessage,
  } = useChatStore();

  navigation.addListener('beforeRemove', () => {
    void client.disconnect();
    clearChannelResources();
    setTTvUsers([]);
  });

  const loadChat = async () => {
    await loadChannelResources(channelId);
  };

  useEffect(() => {
    void (async () => {
      await loadChat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashListRef = useRef<FlashList<ChatMessageType>>(null);
  const messagesRef = useRef<ChatMessageType[]>([]);
  const { styles, theme } = useStyles(stylesheet);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showEmoteMenu, setShowEmoteMenu] = useState<boolean>(false);

  const [messageInput, setMessageInput] = useState<string>('');

  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    username: string;
    message: string;
    replyParentUserLogin: string;
  } | null>(null);

  const [, setIsInputFocused] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);

  // Simplified scroll management
  const BOTTOM_THRESHOLD = 150;
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAtBottomRef = useRef(true);
  const isScrollPausedRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualScrollRef = useRef(false);

  // Simple and reliable scroll to bottom
  const scrollToBottom = useCallback(
    (animated = true) => {
      if (!flashListRef.current) return;

      try {
        if (messages.length > 0) {
          flashListRef.current.scrollToIndex({
            index: messages.length - 1,
            animated,
            viewPosition: 1,
          });
        }
      } catch (error) {
        // Fallback to offset method
        try {
          flashListRef.current.scrollToOffset({
            offset: 999999,
            animated,
          });
        } catch (fallbackError) {
          logger.chat.error('Failed to scroll:', fallbackError);
        }
      }
    },
    [messages.length],
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      // Calculate if we're at the bottom
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      // Update state
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);

      // If user manually scrolled up, pause auto-scrolling
      if (!atBottom && !isManualScrollRef.current) {
        isManualScrollRef.current = true;
        isScrollPausedRef.current = true;
        setIsScrollPaused(true);

        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Auto-resume after 5 seconds
        scrollTimeoutRef.current = setTimeout(() => {
          if (isAtBottomRef.current) {
            isScrollPausedRef.current = false;
            setIsScrollPaused(false);
            isManualScrollRef.current = false;
          }
        }, 5000);
      }

      // Reset states when at bottom
      if (atBottom) {
        setUnreadCount(0);
        if (isScrollPausedRef.current) {
          isScrollPausedRef.current = false;
          setIsScrollPaused(false);
          isManualScrollRef.current = false;
        }
      }
    },
    [],
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Always scroll to bottom if not paused or if at bottom
      if (!isScrollPausedRef.current || isAtBottomRef.current) {
        // Use a small delay to ensure the new message is rendered
        const timeoutId = setTimeout(() => {
          scrollToBottom(false);
        }, 50);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages.length, scrollToBottom]);

  // Handle content size changes
  const handleContentSizeChange = useCallback(() => {
    if (!isScrollPausedRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  // Resume scrolling function
  const resumeScrolling = useCallback(() => {
    isScrollPausedRef.current = false;
    setIsScrollPaused(false);
    isManualScrollRef.current = false;
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setUnreadCount(0);
    scrollToBottom(true);
  }, [scrollToBottom]);

  const MAX_MESSAGES = 150;

  const handleNewMessage = useCallback(
    (newMessage: ChatMessageType) => {
      addMessage(newMessage);

      const updatedMessages = [...messagesRef.current, newMessage].slice(
        -MAX_MESSAGES,
      );
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      // Increment unread count if scrolling is paused
      if (isScrollPausedRef.current && !isAtBottomRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    },
    [addMessage],
  );

  const connectToChat = async () => {
    if (isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);

      await client.connect();

      client.on(
        'message',
        (_channel: string, tags, text: string, _self: boolean) => {
          const userstate = tags;

          const message_id = userstate.id || '0';
          const replyParentMessageId = tags.id;

          const replyParentDisplayName = tags[
            'reply-parent-display-name'
          ] as string;

          const replyParentUserLogin = tags[
            'reply-parent-user-login'
          ] as string;
          const replyParentMessageBody = tags[
            'reply-parent-msg-body'
          ] as string;

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

          const replacedMessage = replaceTextWithEmotes({
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes,
            ffzGlobalEmotes,
            inputString: text.trimEnd(),
            sevenTvChannelEmotes,
            sevenTvGlobalEmotes,
            twitchChannelEmotes,
            twitchGlobalEmotes,
            userstate,
          });

          const replacedBadges = findBadges({
            userstate,
            chatterinoBadges,
            chatUsers: ttvUsers,
            ffzChannelBadges,
            ffzGlobalBadges,
            twitchChannelBadges,
            twitchGlobalBadges,
          });

          const foundTtvUser = ttvUsers.find(
            u => u.name.replace('@', '') === userstate.username,
          );

          if (!foundTtvUser) {
            const ttvUser: ChatUser = {
              name: `@${userstate.username}`,
              userId: userstate['user-id'] ?? '',
              color:
                userstate.color ??
                generateRandomTwitchColor(userstate.username),
              avatar: '',
            };

            setTTvUsers([ttvUser]);
          }

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
        },
      );

      client.on('connecting', () => {
        void client.say(channelName, `Connecting to ${channelName}'s room`);
      });

      client.on('clearchat', () => {
        messagesRef.current = [];
        setMessages([]);
        setUnreadCount(0);
        isScrollPausedRef.current = false;
        setIsScrollPaused(false);
        isManualScrollRef.current = false;
        void client.say(channelName, 'Chat cleared by moderator');
      });

      client.on('disconnected', (reason: string) => {
        logger.chat.info('Disconnected from chat:', reason);
      });
    } catch (error) {
      logger.chat.error('Failed to connect to chat:', error);
      setConnectionError('Failed to connect to chat');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (status === 'fulfilled') {
      void connectToChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInputEnabled(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) {
      return;
    }

    if (replyTo) {
      try {
        await client.say(channelName, `@${replyTo.username} ${messageInput}`);
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      await client.say(channelName, messageInput);
    }

    setMessageInput('');
    setReplyTo(null);

    // Ensure we scroll to bottom after sending
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  }, [channelName, client, messageInput, replyTo, scrollToBottom]);

  const handleEmoteSelect = useCallback((emote: SanitisiedEmoteSet) => {
    setMessageInput(prev => `${prev + emote.name} `);
  }, []);

  const inputContainerRef = useRef<View>(null);
  const [_inputContainerHeight, setInputContainerHeight] = useState(0);

  const measureInputContainer = useCallback(() => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measure((_x, _y, _width, height) => {
        setInputContainerHeight(height);
      });
    }
  }, []);

  const renderItem: ListRenderItem<ChatMessageType> = useCallback(
    ({ item }) => (
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
    [styles.messageContainer],
  );

  if (connectionError) {
    return (
      <View>
        <Typography>Error: {connectionError}</Typography>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Typography style={styles.header} size="sm">
        CHAT
      </Typography>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <FlashList
            data={messages}
            ref={flashListRef}
            keyExtractor={item =>
              `${item.message_id}_${item.message_nonce}_${item.message_id}`
            }
            estimatedItemSize={60}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
            removeClippedSubviews={false}
            initialNumToRender={30}
            maxToRenderPerBatch={20}
            windowSize={20}
            inverted={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />

          {/* Pause indicator */}
          {isScrollPaused && (
            <View style={styles.pausedOverlay}>
              <Typography style={styles.pausedText}>
                Chat paused - new messages: {unreadCount}
              </Typography>
              <Button style={styles.resumeButton} onPress={resumeScrolling}>
                <Typography style={styles.resumeButtonText}>Resume</Typography>
              </Button>
            </View>
          )}

          {/* Resume scroll button */}
          {!isAtBottom && !isScrollPaused && (
            <ResumeScroll
              isAtBottomRef={isAtBottomRef}
              flashListRef={flashListRef}
              setIsAtBottom={setIsAtBottom}
              setUnreadCount={setUnreadCount}
              unreadCount={unreadCount}
              scrollToBottom={scrollToBottom}
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
              <Typography size="sm" style={styles.replyText}>
                Replying to {replyTo.username}
              </Typography>
              <Button
                style={styles.cancelReplyButton}
                onPress={() => setReplyTo(null)}
              >
                <Icon icon="x" size={16} color={theme.colors.border} />
              </Button>
            </View>
          )}
          <Button
            style={styles.sendButton}
            onPress={() => setShowEmoteMenu(true)}
          >
            <Icon icon="smile" size={24} color={theme.colors.border} />
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
            editable={inputEnabled}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#666"
            onSubmitEditing={() => void handleSendMessage()}
            returnKeyType="send"
            prioritizeChannelEmotes
            status={status}
            sevenTvChannelEmotes={sevenTvChannelEmotes}
            sevenTvGlobalEmotes={sevenTvGlobalEmotes}
            twitchChannelEmotes={twitchChannelEmotes}
            twitchGlobalEmotes={twitchGlobalEmotes}
            bttvChannelEmotes={bttvChannelEmotes}
            bttvGlobalEmotes={bttvGlobalEmotes}
            ffzChannelEmotes={ffzChannelEmotes}
            ffzGlobalEmotes={ffzGlobalEmotes}
            emojis={[]}
            ttvUsers={ttvUsers}
          />
          <Button
            style={styles.sendButton}
            onPress={() => void handleSendMessage()}
            disabled={!messageInput.trim()}
          >
            <Icon
              icon="send"
              size={24}
              color={
                messageInput.trim().length > 0
                  ? theme.colors.iOS_blue
                  : theme.colors.borderFaint
              }
            />
          </Button>
        </View>
      </KeyboardAvoidingView>

      <EmoteMenuModal
        isVisible={showEmoteMenu}
        onClose={() => setShowEmoteMenu(false)}
        onEmoteSelect={handleEmoteSelect}
      />
    </SafeAreaView>
  );
});

Chat.displayName = 'Chat';

const stylesheet = createStyleSheet(theme => ({
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
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#efeff1',
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
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
    position: 'relative',
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    minHeight: 50,
    overflow: 'hidden',
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pausedText: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
  },
  resumeButton: {
    backgroundColor: theme.colors.brightPurple,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  resumeButtonText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.foregroundInverted,
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  replyText: {
    flex: 1,
    color: theme.colors.text,
  },
  cancelReplyButton: {
    padding: theme.spacing.xs,
  },
  emojiPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 300,
  },
}));
