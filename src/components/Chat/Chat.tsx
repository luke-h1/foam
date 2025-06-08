/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { ChatMessageType, ChatUser, useChatStore } from '@app/store/chatStore';
import { generateRandomTwitchColor } from '@app/utils';
import { findBadges } from '@app/utils/chat/findBadges';
import { replaceTextWithEmotes } from '@app/utils/chat/replaceTextWithEmotes';
import { logger } from '@app/utils/logger';
import { generateNonce } from '@app/utils/string/generateNonce';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  TextInput,
  useWindowDimensions,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Typography } from '../Typography';
import { ChatMessage } from './ChatMessage';
import { ChatSkeleton } from './ChatSkeleton';

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

  const { width, height } = useWindowDimensions();

  // Portrait only: 100% width, 60% height
  const chatWidth = width;
  const chatHeight = height * 0.6;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastContentHeightRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    username: string;
    message: string;
    replyParentUserLogin: string;
  } | null>(null);

  const connectToChat = async () => {
    if (isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      await client.connect();

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      client.on('message', (_channel, tags, text, _self) => {
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
          u => u.name === `@${userstate.username}`,
        );

        if (!foundTtvUser) {
          const ttvUser: ChatUser = {
            name: `@${userstate.username}`,
            userId: userstate['user-id'] ?? '',
            color:
              userstate.color ?? generateRandomTwitchColor(userstate.username),
            avatar: '', // todo fetch this for static twitch CDN,
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
      });

      client.on('clearchat', () => {
        messagesRef.current = [];
        setMessages([]);
        setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: false });
        }, 0);
      });

      client.on('disconnected', reason => {
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

  // Track scroll position
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Update refs with current values
    lastScrollYRef.current = contentOffset.y;
    viewportHeightRef.current = layoutMeasurement.height;
    lastContentHeightRef.current = contentSize.height;

    const isAtBottomNow =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setIsAtBottom(isAtBottomNow);
  };

  const handleContentSizeChange = (_width: number, height: number) => {
    lastContentHeightRef.current = height;
  };

  const addMessageAndMaybeScroll = (newMessage: ChatMessageType) => {
    messagesRef.current = [...messagesRef.current, newMessage];
    setMessages([...messagesRef.current]);

    const isCurrentlyAtBottom =
      viewportHeightRef.current + lastScrollYRef.current >=
      lastContentHeightRef.current - 20;

    if (isCurrentlyAtBottom) {
      // eslint-disable-next-line no-undef
      requestAnimationFrame(() => {
        flashListRef.current?.scrollToIndex({
          index: messagesRef.current.length - 1,
          animated: false,
        });
      });
    }
  };

  // Update the message handler to add messages
  const handleNewMessage = useCallback(
    (newMessage: ChatMessageType) => {
      addMessage(newMessage);
      addMessageAndMaybeScroll(newMessage);
    },
    [addMessage],
  );

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) return;

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

    // Clear input and reply state
    setMessageInput('');
    setReplyTo(null);
  }, [channelName, client, messageInput, replyTo]);

  if (status === 'loading') {
    return <ChatSkeleton />;
  }

  if (status === 'error' || connectionError) {
    return (
      <View>
        <Typography>
          Error: {connectionError || 'Error getting emotes'}
        </Typography>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Typography style={styles.header} size="sm">
        CHAT
      </Typography>
      <View
        style={[styles.chatContainer, { width: chatWidth, height: chatHeight }]}
      >
        <FlashList
          data={messages}
          ref={flashListRef}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
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
          )}
          estimatedItemSize={40}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
        />
        {!isAtBottom && (
          <View style={styles.pausedOverlay}>
            <Typography style={styles.pausedText}>Chat Paused</Typography>
            <Button
              style={styles.resumeButton}
              onPress={() => {
                flashListRef.current?.scrollToEnd({ animated: true });
              }}
            >
              <Typography style={styles.resumeButtonText}>Resume</Typography>
            </Button>
          </View>
        )}
      </View>
      <View style={styles.inputContainer}>
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
          onPress={() => setShowEmotePicker(!showEmotePicker)}
        >
          <Icon icon="smile" size={24} color={theme.colors.border} />
        </Button>
        <TextInput
          style={styles.input}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder={
            replyTo ? `Reply to ${replyTo.username}` : 'Send a message'
          }
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#666"
          onSubmitEditing={() => void handleSendMessage()}
          returnKeyType="send"
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
              messageInput.trim()
                ? theme.colors.border
                : theme.colors.borderFaint
            }
          />
        </Button>
      </View>
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
    // backgroundColor: theme.colors.borderFaint,
  },

  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // alignItems: 'flex-start',
    width: '100%',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  pausedText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  resumeButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: theme.radii.md,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
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
}));
