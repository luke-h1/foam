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
import { LegendListRef, LegendListRenderItemProps } from '@legendapp/list';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
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

  const legendListRef = useRef<LegendListRef>(null);
  const messagesRef = useRef<ChatMessageType[]>([]);
  const { styles, theme } = useStyles(stylesheet);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);

  const [messageInput, setMessageInput] = useState<string>('');

  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    username: string;
    message: string;
    replyParentUserLogin: string;
  } | null>(null);

  const [, setIsInputFocused] = useState(false);

  const [inputEnabled, setInputEnabled] = useState(false);

  const BOTTOM_THRESHOLD = 100; // px
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);

      if (atBottom) {
        setUnreadCount(0);
      }
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      legendListRef.current?.scrollToEnd({ animated: false });
    }
  }, []);

  const MAX_MESSAGES = 150;

  const handleNewMessage = useCallback(
    (newMessage: ChatMessageType) => {
      addMessage(newMessage);

      const updatedMessages = [...messagesRef.current, newMessage].slice(
        -MAX_MESSAGES,
      );
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      if (!isAtBottomRef.current) {
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
          u => u.name.replace('@', '') === userstate.username,
        );

        /**
         * Look into https://api.twitch.tv/helix/chat/chatters and seeing if that is more performant than writing to store
         */
        if (!foundTtvUser) {
          const ttvUser: ChatUser = {
            name: `@${userstate.username}`,
            userId: userstate['user-id'] ?? '',
            color:
              userstate.color ?? generateRandomTwitchColor(userstate.username),
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
      });

      client.on('connecting', () => {
        void client.say(channelName, `Connecting to ${channelName}'s room`);
      });

      client.on('clearchat', () => {
        messagesRef.current = [];
        setMessages([]);
        setTimeout(() => {
          legendListRef.current?.scrollToEnd({ animated: false });
        }, 0);
        void client.say(channelName, 'Chat cleared by moderator');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setInputEnabled(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
            keyExtractor={item =>
              `${item.message_id}_${item.message_nonce}_${item.message_id}`
            }
            recycleItems
            waitForInitialLayout
            estimatedItemSize={150}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
          />
          {!isAtBottom && (
            <ResumeScroll
              isAtBottomRef={isAtBottomRef}
              legendListRef={legendListRef}
              setIsAtBottom={setIsAtBottom}
              setUnreadCount={setUnreadCount}
              unreadCount={unreadCount}
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
            onPress={() => setShowEmotePicker(!showEmotePicker)}
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
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  pausedText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
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
