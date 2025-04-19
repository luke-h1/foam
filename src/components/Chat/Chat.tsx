/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { useChatStore } from '@app/store/chatStore';
import { replaceWithEmotesV2 } from '@app/utils/chat/replaceTextWithEmotesV2';
import { generateNonce } from '@app/utils/string/generateNonce';
import { memo, useEffect, useRef, useState } from 'react';
import { FlatList, SafeAreaView, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ChatUserstate } from 'tmi.js';
import { Typography } from '../Typography';
import { ChatMessageV2, ChatMessageV2Props } from './ChatMessageV2';

export interface FormattedChatMessage {
  user: ChatUserstate;
  message: JSX.Element[];
  badges: JSX.Element[];
}

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const {
    sevenTvChannelEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvGlobalEmotes,
    twitchGlobalEmotes,
  } = useChatStore();

  const flashListRef = useRef<FlatList<ChatMessageV2Props>>(null);
  const messagesRef = useRef<ChatMessageV2Props[]>([]);
  const { styles } = useStyles(stylesheet);

  // Get screen width & height to detect orientation
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Reanimated shared values
  const chatWidth = useSharedValue(isLandscape ? width * 0.4 : width);
  const chatHeight = useSharedValue(isLandscape ? height : 600);

  // Animate layout changes
  useEffect(() => {
    chatWidth.value = withTiming(isLandscape ? width * 0.4 : width, {
      duration: 300,
    });
    chatHeight.value = withTiming(isLandscape ? height : 600, {
      duration: 300,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandscape, width, height]);

  const animatedChatStyle = useAnimatedStyle(() => ({
    width: chatWidth.value,
    height: chatHeight.value,
  }));

  const client = useTmiClient({
    options: {
      clientId: process.env.TWITCH_CLIENT_ID,
      skipUpdatingEmotesets: true,
    },
    channels: [channelName],
    identity: {
      username: user?.display_name,
      password: authState?.token.accessToken,
    },
    connection: {
      reconnect: !__DEV__,
    },
  });

  const [messages, setMessages] = useState<ChatMessageV2Props[]>([]);

  const connectToChat = () => {
    client.connect();

    client.on('message', async (_channel, tags, text, _self) => {
      const userstate = tags as ChatUserstate;

      const message_id = userstate.id || '0';
      const message_nonce = generateNonce() || '0';
      const replacedMessage = replaceWithEmotesV2({
        bttvChannelEmotes: [],
        bttvGlobalEmotes: [],
        ffzChannelEmotes,
        ffzGlobalEmotes,
        inputString: text.trim(),
        sevenTvChannelEmotes,
        sevenTvGlobalEmotes,
        twitchChannelEmotes,
        twitchGlobalEmotes,
        userstate,
      });

      console.log('replacedMessage', replacedMessage);

      const newMessage: ChatMessageV2Props = {
        userstate,
        message: replacedMessage,
        channel: '',
        message_id,
        message_nonce,
        sender: '',
      };

      // Append the new message to the existing messages
      messagesRef.current = [...messagesRef.current, newMessage];
      setMessages([...messagesRef.current]);

      // Scroll to the end of the chat
      flashListRef.current?.scrollToEnd({ animated: false });
    });

    client.on('clearchat', () => {
      messagesRef.current = [];
      setMessages([]);
      flashListRef.current?.scrollToEnd({ animated: false });
    });

    navigation.addListener('blur', () => {
      client.disconnect();
    });
  };

  useEffect(() => {
    connectToChat();
    return () => {
      client.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Typography style={styles.header}>Chat</Typography>
      <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
        <FlatList
          data={messages}
          ref={flashListRef}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <ChatMessageV2
              channel={item.channel}
              message={item.message}
              userstate={item.userstate}
              message_id={item.message_id}
              message_nonce={item.message_nonce}
              sender={item.sender}
              style={styles.messageContainer}
            />
          )}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: 40,
            offset: 40 * index,
            index,
          })}
        />
      </Animated.View>
    </SafeAreaView>
  );
});
Chat.displayName = 'Chat';

const stylesheet = createStyleSheet(theme => ({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    marginHorizontal: theme.spacing.sm,
  },
  header: {
    fontSize: 24,
    margin: theme.spacing.md,
  },
  chatContainer: {
    flex: 1,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.borderFaint,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Ensure text wraps
    // alignItems: 'flex-start',
    width: '100%', // Ensure it fits within the screen
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm, // Optional: Add rounded corners
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
}));
