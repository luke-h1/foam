import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { parseBadges } from '@app/utils/third-party/badges';
import { parseEmotes } from '@app/utils/third-party/emotes';
import { memo, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  useWindowDimensions,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ChatUserstate } from 'tmi.js';
import { ChatMessage } from '../ChatMessage';
import { Typography } from '../Typography';

export interface FormattedChatMessage {
  user: ChatUserstate;
  message: JSX.Element[];
  badges: JSX.Element[];
}

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelId, channelName }: ChatProps) => {
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const flashListRef = useRef<FlatList<FormattedChatMessage>>(null);
  const messagesRef = useRef<FormattedChatMessage[]>([]);
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
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

  const connectToChat = () => {
    const options = { channelId };

    client.connect();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client.on('message', async (_channel, tags, text, _self) => {
      const badges = (
        await parseBadges(tags.badges, tags.username, options)
      ).toHTML();

      const message = (await parseEmotes(text, tags.emotes, options)).toHTML();

      const newMessage: FormattedChatMessage = { badges, user: tags, message };

      messagesRef.current = [...messagesRef.current, newMessage];
      setMessages([...messagesRef.current]);

      if (isAutoScroll) {
        requestAnimationFrame(() => {
          flashListRef.current?.scrollToEnd({ animated: false });
        });
      }
    });

    client.on('clearchat', () => {
      messagesRef.current = [];
      setMessages([]);
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

  useEffect(() => {
    if (isAutoScroll) {
      flashListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages, isAutoScroll]);

  const handleScroll = event => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;

    setIsAutoScroll(isAtBottom);
  };

  const handleResumeScroll = () => {
    setIsAutoScroll(true);
    requestAnimationFrame(() => {
      flashListRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Typography style={styles.header}>Chat</Typography>
      <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
        <FlatList
          data={messages}
          ref={flashListRef}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => <ChatMessage item={item} />}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: 40,
            offset: 40 * index,
            index,
          })}
        />
        {!isAutoScroll && (
          <View style={styles.pausedOverlay}>
            <Text style={styles.pausedText}>Chat paused due to scroll</Text>
            <TouchableOpacity
              onPress={handleResumeScroll}
              style={styles.resumeButton}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
});
Chat.displayName = 'Chat';

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
    marginHorizontal: theme.spacing.sm,
    // backgroundColor: theme.colors.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    // color: theme.colors.primary,
    margin: theme.spacing.md,
  },
  chatContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    // backgroundColor: theme.colors.backgroundLight,
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
    // backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: theme.radii.md,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
  },
}));
