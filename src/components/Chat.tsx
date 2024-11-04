/* eslint-disable */
import { useAuthContext } from '@app/context/AuthContext';
import useTmiClient from '@app/hooks/useTmiClient';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState, memo } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { ChatUserstate } from 'tmi.js';

interface ChatProps {
  channelId: string;
  channelName: string;
}

interface ChatMessage {
  username: string;
  content: string;
}

const MAX_MESSAGES = 100; // Maximum number of messages to retain

const ChatMessageItem = memo(({ username, content }: ChatMessage) => (
  <View style={styles.messageContainer}>
    <View style={styles.messageContent}>
      <Text style={styles.username}>{username}: </Text>
      <Text style={styles.message}>{content}</Text>
    </View>
  </View>
));
ChatMessageItem.displayName = 'ChatMessageItem';

export default function Chat({ channelId, channelName }: ChatProps) {
  const { auth, user } = useAuthContext();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const tmiClientRef = useRef(
    useTmiClient({
      options: {
        clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
      channels: [channelName],
      identity: {
        username: user?.display_name,
        password: auth?.anonToken || auth?.token?.accessToken,
      },
    }),
  );

  useEffect(() => {
    const tmiClient = tmiClientRef.current;

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

      if (messages.length >= MAX_MESSAGES) {
        setMessages(prev => prev.slice(1));
      }

      setMessages(prev => {
        const newMessages = [
          ...prev,
          {
            username: tags['display-name'] as string,
            content: message,
          },
        ];

        return newMessages;
      });
    };

    tmiClient.connect();
    tmiClient.on('message', handleMessage);
    tmiClient.on('clearchat', () => {
      setMessages([]);
    });

    navigation.addListener('blur', () => {
      tmiClient.disconnect();
    });

    return () => {
      tmiClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatWrapper}>
        <Text style={styles.header}>Chat</Text>
      </View>
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          ref={flatListRef}
          keyExtractor={(_, index) => index.toString()}
          renderScrollComponent={props => <ScrollView {...props} />}
          onScroll={event => {
            if (
              event.nativeEvent.contentOffset.y <
              event.nativeEvent.contentSize.height
            ) {
              // setScrollPaused(true);
            }

            if (
              event.nativeEvent.contentOffset.y >
              event.nativeEvent.contentSize.height
            ) {
              // setScrollPaused(false);
            }
          }}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
          renderItem={({ item }) => (
            <ChatMessageItem username={item.username} content={item.content} />
          )}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  chatWrapper: {
    padding: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#ccc',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 4,
  },
  chatContainer: {
    borderTopLeftRadius: 1,
    borderTopWidth: 2,
    flex: 1,
    justifyContent: 'flex-start', // Ensure messages start at the top
    maxHeight: 350,
  },
  contentContainer: {
    padding: 8,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  messageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    textAlign: 'left',
    alignItems: 'flex-start',
  },
  username: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  message: {
    flex: 1,
  },
});
