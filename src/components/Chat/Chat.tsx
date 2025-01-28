// eslint-disable-next-line import/no-cycle
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useTmiClient } from '@app/hooks';
import { BadgeVersions } from '@app/utils/third-party/types';
import { FlashList } from '@shopify/flash-list';
import { parseBadges, parseEmotes } from 'emotettv';

import { memo, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, View } from 'react-native';
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
  const flashListRef = useRef<FlashList<FormattedChatMessage>>(null);
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

      /**
       * TODO:
       * TWO APPROACHES
       * one - use react-native-render-html to render out the msgs, add custom node visitors to style it
       * two - use toArray and create our own components
       */
      const payload = {
        tags,
        htmlMessage,
        htmlBadges,
      };

      flashListRef.current?.scrollToEnd();
      /* 
      twitch badges only. 3rd party badges are not included (7tv, ffz, bttv). 
      We need to fetch them separately and cache them.

      */
      //  https://github.com/andregamma/twitch-webos
      // https://github.com/andregamma/twitch-webos/blob/main/apps/twitch-webos-app/src/components/Chat/Chat.js
      // console.log('badges ->', tags.badges);
      // look into https://github.com/mkody/twitch-emoticons
      // github.com/mino129/twitch-chat-pwa/blob/4c6d7e175838723375096d860ee2fa547b57e361/twitch-chat-pwa/src/components/chat.js#L5

      setMessages(prev => [...prev.slice(20), payload]);
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

  useEffect(() => {
    if (flashListRef.current) {
      flashListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <Typography style={styles.header}>Chat</Typography>
      <FlatList
        data={messages}
        // ref={flashListRef}
        // estimatedItemSize={1000}
        scrollEnabled
        keyExtractor={(_, index) => index.toString()}
        // eslint-disable-next-line react/no-unstable-nested-components
        ItemSeparatorComponent={() => <View style={{ marginBottom: 5 }} />}
        renderItem={({ item }) => <ChatMessage item={item} />}
        pagingEnabled
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flashListRef.current?.scrollToEnd();
          }
        }}
      />
    </SafeAreaView>
  );
});
Chat.displayName = 'Chat';

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
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
