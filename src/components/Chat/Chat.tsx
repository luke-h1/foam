import { useAuthContext } from '@app/context/AuthContext';
import useTmiClient from '@app/hooks/useTmiClient';
import { parseEmotes } from '@app/lib/chat';
import { useNavigation } from '@react-navigation/native';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { ChatUserstate } from 'tmi.js';

interface Props {
  channels: string[];
  twitchChannelId: string;
}

interface Message {
  username: string;
  content: ReactNode;
}

const Chat = ({ channels, twitchChannelId }: Props) => {
  const { auth, user } = useAuthContext();
  const navigation = useNavigation();
  const [notice, setNotice] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scrollPaused, setScrollPaused] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { disconnect, tmiClient } = useTmiClient({
    channels,
    tmiOptions: {
      options: {
        clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
      identity: {
        username: user?.display_name,
        password: auth?.anonToken ?? auth?.token?.accessToken,
      },
      connection: {
        timeout: 5000,
      },
    },
  });

  useEffect(() => {
    const handleMessage = async (
      channel: string,
      tags: ChatUserstate,
      message: string,
      self: boolean,
    ) => {
      if (self) {
        // Don't listen to my own messages
        return;
      }
      const [parsedMessage] = await Promise.all([
        await parseEmotes(message, tags.emotes, {
          channelId: channel,
          twitchUserId: twitchChannelId,
        }),
        // await parseBadges(tags.badges, { channelId: twitchChannelId }),
      ]);

      const htmlMessage = parsedMessage.toHtml();

      setMessages(prev => [
        ...prev,
        {
          username: tags['display-name'] as string,
          content: htmlMessage,
        },
      ]);
    };

    tmiClient.on('message', handleMessage);
    tmiClient.on('clearchat', () => {
      setMessages([]);
      setNotice('Chat cleared by moderator');
      setTimeout(() => {
        setNotice('');
      }, 1500);
    });

    navigation.addListener('blur', () => {
      disconnect();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ padding: 2, maxHeight: 'auto' }}>
      <View>
        <FlatList
          data={messages}
          ref={flatListRef}
          keyExtractor={index => index.toString() + Math.random()}
          renderScrollComponent={props => <ScrollView {...props} />}
          onScroll={event => {
            if (
              event.nativeEvent.contentOffset.y <
              event.nativeEvent.contentSize.height
            ) {
              setScrollPaused(true);
            }

            if (
              event.nativeEvent.contentOffset.y >
              event.nativeEvent.contentSize.height
            ) {
              setScrollPaused(false);
            }
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          renderItem={({ item }) => {
            return (
              <View
                style={{
                  display: 'flex',
                  marginBottom: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                }}
              >
                {notice && <Text>{notice}</Text>}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text>{item.username}: </Text>
                  <View
                    style={{
                      flexShrink: 1,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text>{item.content}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};
export default Chat;
