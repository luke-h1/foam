import { SanitisedBadgeSet, SanitisiedEmoteSet } from '@app/services';
import { extractEmotes, sanitizeInput } from '@app/utils/chat';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

interface UserState {
  username: string;
  displayName?: string;
  id?: string;
  color?: string;
  badges?: SanitisedBadgeSet[];
  emotes?: SanitisiedEmoteSet[];
  noMention?: boolean;
  'reply-parent-display-name'?: string;
  'reply-parent-user-login'?: string;
  'reply-parent-msg-body'?: string;
  'first-msg'?: boolean;
  'badges-raw'?: string;
  'badge-info'?: Record<string, string>;
  message_label?: string;
  backgroundColor?: string;
  bits?: string;
}

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  emotes?: SanitisiedEmoteSet[];
}

export interface ChatMessageV2Props {
  userstate: UserState;
  message: string;
  channel: string;
}

export const ChatMessageV2 = ({
  userstate,
  message,
  channel,
}: ChatMessageV2Props) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
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
          <Text
            style={[styles.username, { color: userstate.color || '#FFFFFF' }]}
          >
            {msg.username}:
          </Text>
          <Text style={styles.messageText}>{msg.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
});
