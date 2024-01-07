import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { ScrollView, Stack, Text } from 'tamagui';
import { ChatUserstate } from 'tmi.js';
import { useAuthContext } from '../../../context/AuthContext';
import useTmiClient from '../../../hooks/useTmiClient';

interface Props {
  channels: string[];
}

const Chat = ({ channels }: Props) => {
  const { auth, user } = useAuthContext();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scrollPaused, setScrollPaused] = useState(false);
  const flatListRef = useRef<FlatList<string>>(null);

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
    const handleMessage = (
      channel: string,
      tags: ChatUserstate,
      message: string,
      self: boolean,
    ) => {
      if (self) {
        // Don't listen to my own messages..
        return;
      }

      const messageWithUsername = `${tags.username}: ${message}`;

      setMessages(prevMessages => {
        return [...prevMessages, messageWithUsername];
      });
    };

    tmiClient.on('message', handleMessage);

    // Clean up the event listener when the component unmounts
    return () => {
      tmiClient.removeListener('message', handleMessage);
    };
  }, [tmiClient]);

  navigation.addListener('blur', () => {
    disconnect();
  });

  return (
    <SafeAreaView style={{ padding: 2, maxHeight: 'auto' }}>
      <Stack>
        <FlatList
          data={messages}
          ref={flatListRef}
          keyExtractor={index => index.toString() + Math.random()}
          renderScrollComponent={props => <ScrollView {...props} />}
          onScroll={event => {
            // pause scrolling if user scrolls up
            if (
              event.nativeEvent.contentOffset.y <
              event.nativeEvent.contentSize.height
            ) {
              setScrollPaused(true);
            }

            // resume scrolling if user scrolls to bottom
            if (
              event.nativeEvent.contentOffset.y >=
              event.nativeEvent.contentSize.height
            ) {
              setScrollPaused(false);
            }
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          renderItem={({ item }) => {
            const username = item.split(':')[0];
            const message = item.split(':')[1];

            return (
              <Stack
                display="flex"
                marginBottom={4}
                paddingHorizontal={5}
                paddingVertical={2}
              >
                <Text>
                  {username}: {message}
                </Text>
              </Stack>
            );
          }}
        />
      </Stack>
    </SafeAreaView>
  );
};
export default Chat;
