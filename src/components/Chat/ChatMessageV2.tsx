import { SanitisiedEmoteSet } from '@app/services';
import { extractEmotes, sanitizeInput } from '@app/utils/chat';
import { formatDate } from '@app/utils/date-time';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ChatUserstate } from 'tmi.js';
import { Typography } from '../Typography';

interface Message {
  id: string;
  username: ChatUserstate['username'];
  message: string;
  timestamp: Date;
  emotes?: SanitisiedEmoteSet[];
}

export interface ChatMessageV2Props {
  userstate: ChatUserstate;
  message: string;
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
}

export const ChatMessageV2 = ({
  userstate,
  message,
  channel,
  message_id,
  message_nonce,
  sender,
}: ChatMessageV2Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { styles } = useStyles(stylesheet);

  useEffect(() => {
    (async () => {
      if (!userstate || !message) return;

      const sanitizedMessage = sanitizeInput(message.trimStart());
      const currentTime = new Date();

      const newMessage: Message = {
        id: userstate.id || '0',
        username: userstate.username,
        message: sanitizedMessage,
        timestamp: currentTime,
        emotes: extractEmotes(userstate.emotes, sanitizedMessage),
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);

      // Play mention sound if username is mentioned
      // if (checkUsernameMention(sanitizedMessage, 'yourUsername')) {
      //   const sound = new Sound('mention.mp3', Sound.MAIN_BUNDLE, error => {
      //     if (!error) sound.play();
      //   });
      // }
    })();
  }, [userstate, message]);

  return (
    <ScrollView style={styles.chatContainer}>
      {messages.map(msg => (
        <View key={msg.id} style={styles.messageContainer}>
          {/* <View style={styles.badgesContainer}>
            {userstate.badges &&
              userstate.badges?.map((badge, index) => (
                <Image
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  source={{ uri: badge.url }}
                  style={[
                    styles.badge,
                    { backgroundColor: badge.color || 'transparent' },
                  ]}
                />
              ))}
          </View> */}
          <Typography style={styles.timestamp} size="sm">
            {formatDate(msg.timestamp, 'HH:mm')}{' '}
          </Typography>
          <Typography
            size="sm"
            style={[styles.username, { color: userstate.color || '#FFFFFF' }]}
          >
            {msg.username}:
          </Typography>
          <Typography size="sm" style={styles.messageText}>
            {msg.message}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
};

const stylesheet = createStyleSheet(theme => ({
  chatContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  badge: {
    width: 20,
    height: 20,
    marginRight: 2,
  },
  username: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  messageText: {
    color: '#FFF',
  },
  timestamp: {
    color: theme.colors.border,
  },
}));
