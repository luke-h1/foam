import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { BadgeVersions } from '@app/utils/third-party/types';
import { parseBadges, parseEmotes } from 'emotettv';
import { memo, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, SafeAreaView } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ChatUserstate } from 'tmi.js';
import { ChatMessage } from '../ChatMessage';
import { Typography } from '../Typography';

export interface FormattedChatMessage {
  tags: ChatUserstate;
  htmlMessage: string;
  htmlBadges: string;
}

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelId, channelName }: ChatProps) => {
  const { authState, user } = useAuthContext();
  const navigation = useAppNavigation();
  const flashListRef = useRef<FlatList<FormattedChatMessage>>(null);
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const { styles } = useStyles(stylesheet);

  const client = useTmiClient({
    options: {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
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
    const options = {
      channelId,
    };

    // eslint-disable-next-line no-console
    client.connect().then(() => console.log('connected'));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client.on('message', async (_channel, tags, text, _self) => {
      const badges = await parseBadges(
        tags.badges as BadgeVersions,
        tags.username,
        options,
      );
      const message = await parseEmotes(text, tags.emotes, options);
      const htmlBadges = badges.toHTML();
      const htmlMessage = message.toHTML();

      const payload = {
        tags,
        htmlMessage,
        htmlBadges,
      };

      setMessages(prev => [...prev, payload]);
    });

    client.on('clearchat', () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <Typography style={styles.header}>Chat</Typography>
      <FlatList
        data={messages}
        ref={flashListRef}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <ChatMessage item={item} />}
        onContentSizeChange={() => {
          if (flashListRef.current) {
            flashListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
    </SafeAreaView>
  );
});
Chat.displayName = 'Chat';

const stylesheet = createStyleSheet(theme => ({
  container: {
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
    marginHorizontal: theme.spacing.sm,
    height: 600,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.borderFaint,
    margin: 4,
  },
}));
