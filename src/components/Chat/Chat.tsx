import { Text } from '@app/components/Text';
import { useAuthContext } from '@app/context/AuthContext';
import useTmiClient from '@app/hooks/useTmiClient';
import { parseEmotes } from '@app/lib/chat';
import { useNavigation } from '@react-navigation/native';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { ScrollView, Stack } from 'tamagui';
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
  }, []);

  return (
    <SafeAreaView style={{ padding: 2, maxHeight: 'auto' }}>
      <Stack>
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
              <Stack
                display="flex"
                marginBottom={4}
                paddingHorizontal={5}
                paddingVertical={2}
              >
                {notice && (
                  <Text color="$accent1" fontSize={17} marginBottom={2}>
                    {notice}
                  </Text>
                )}
                <Stack
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="flex-start"
                >
                  <Text color="azure" fontSize={17} marginRight={2}>
                    {item.username}:{' '}
                  </Text>
                  <Stack flexShrink={1} flexDirection="row" flexWrap="wrap">
                    <Text alignItems="flex-start" textAlign="left">
                      {item.content}
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            );
          }}
        />
      </Stack>
    </SafeAreaView>
  );
};
export default Chat;
