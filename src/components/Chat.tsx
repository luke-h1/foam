// eslint-disable-next-line import/no-cycle
import ChatMessage from '@app/components/ChatMessage';
import { useAuthContext } from '@app/context/AuthContext';
import { useMounted } from '@app/hooks/useMounted';
import useTmiClient from '@app/hooks/useTmiClient';
import { parseBadges } from '@app/utils/third-party/badges';
import { parseEmotes } from '@app/utils/third-party/emotes';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useRef, useState, memo } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export interface CommonMessage {
  user: {
    name: string;
    color: string;
  };
  message: JSX.Element[];
  badges: string;
}

interface ChatProps {
  channelId: string;
  channelName: string;
}

const Chat = memo(({ channelId, channelName }: ChatProps) => {
  const { auth, user } = useAuthContext();
  const navigation = useNavigation();
  const flashListRef = useRef<FlashList<CommonMessage>>(null);
  const { onMounted } = useMounted();

  const [messages, setMessages] = useState<CommonMessage[]>([]);

  const tmiClient = useTmiClient({
    options: {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
    },
    channels: [channelName],
    identity: {
      username: user?.display_name,
      password: auth?.anonToken || auth?.token?.accessToken,
    },
    connection: {
      reconnect: !__DEV__,
    },
  });

  const connectToChat = () => {
    const options = {
      channelId,
    };

    tmiClient.connect();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tmiClient.on('message', async (channel, tags, text, _self) => {
      const displayName = tags['display-name'];

      /* 
      twitch badges only. 3rd party badges are not included (7tv, ffz, bttv). 
      We need to fetch them separately and cache them.

      format: {"rplace-2023": "1"}
      {"artist-badge": "1", "subscriber": "42", "vip": "1"}
      */

      // console.log('badges ->', tags.badges);

      const badges = await parseBadges(tags.badges, tags.username, options);
      const htmlBadges = badges.toHTML();

      const message = await parseEmotes(text, tags.emotes, options);
      const htmlMessage = message.toHTML();

      setMessages(prevMessages => {
        return [
          ...prevMessages,
          {
            badges: htmlBadges,
            user: {
              name: displayName || '',
              color: tags.color || '',
            },
            message: htmlMessage,
          },
        ];
      });
    });

    tmiClient.on('clearchat', () => {
      setMessages([]);
    });

    navigation.addListener('blur', () => {
      tmiClient.disconnect();
    });
  };

  useEffect(() => {
    connectToChat();

    return () => {
      tmiClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  onMounted(() => {
    if (flashListRef.current) {
      flashListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatWrapper}>
        <Text style={styles.header}>Chat</Text>
        <FlashList
          data={messages || []}
          ref={flashListRef}
          estimatedItemSize={1000}
          scrollEnabled
          keyExtractor={(_, index) => index.toString()}
          // eslint-disable-next-line react/no-unstable-nested-components
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <ChatMessage item={item} />}
          pagingEnabled
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flashListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
});
Chat.displayName = 'Chat';

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
  },
  chatWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    height: '100%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    margin: 4,
  },
});
