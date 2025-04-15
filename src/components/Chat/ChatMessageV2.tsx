/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { SanitisiedEmoteSet } from '@app/services';
import {
  checkUsernameVariations,
  extractEmotes,
  sanitizeInput,
} from '@app/utils/chat';
import { formatDate } from '@app/utils/date-time';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ChatUserstate } from 'tmi.js';
import { Typography } from '../Typography';

interface Message {
  id: string;
  username: ChatUserstate['username'];
  message: string;
  timestamp: Date;
  emotes?: SanitisiedEmoteSet[];
  isFirstMessage: boolean;
  isAnnouncement: boolean;
}

export interface ChatMessageV2Props {
  userstate: ChatUserstate;
  message: string;
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
}

export const ChatMessageV2 = ({
  userstate,
  message,
  channel,
  message_id,
  message_nonce,
  sender,
  style,
}: ChatMessageV2Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { styles } = useStyles(stylesheet);

  useEffect(() => {
    (async () => {
      if (!userstate || !message) {
        return;
      }

      let sanitizedMessage = sanitizeInput(message.trimStart());
      const currentTime = new Date();

      if (channel && channel.toLowerCase().replace('#', '') === channel) {
        // onMessage(userstate, message);
      }

      let username = userstate.username?.trim();
      let displayname = userstate['display-name']?.trim();
      let finalUsername = userstate.username?.trim();

      const replyDisplayName = userstate['reply-parent-display-name'];
      const replyUserLogin = userstate['reply-parent-user-login'];

      if (username && displayname) {
        if (username.toLowerCase() === displayname.toLowerCase()) {
          finalUsername = `${displayname}:`;
        } else {
          finalUsername = `${username} (${displayname}):`;
        }
      }

      let isUsernameMentioned = checkUsernameVariations(
        message,
        username as string,
      );
      let isUsernameMentionedInReplyBody: boolean = false;

      if (
        userstate &&
        userstate['reply-parent-msg-body'] &&
        !isUsernameMentioned
      ) {
        isUsernameMentionedInReplyBody = await checkUsernameVariations(
          userstate['reply-parent-msg-body'],
          username as string,
        );
      }

      if (replyDisplayName || replyUserLogin) {
        const escapedDisplayName = replyDisplayName.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        const escapedUserLogin = replyUserLogin.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        const usernamePattern = new RegExp(
          `@(${escapedDisplayName}|${escapedUserLogin})(,\\s?)?`,
          'i',
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps, no-param-reassign
        sanitizedMessage = message.replace(usernamePattern, '').trimStart();
      }

      /**
       * TODO:
       */

      // create debug screen that just connects to chat based on username

      // parse badges
      // write badge parsing function that takes in userstate here
      // create badge store

      // parse emotes
      // write emote parsing function that takes in userstate here

      const newMessage: Message = {
        id: userstate.id || '0',
        username: finalUsername,
        message: sanitizedMessage,
        timestamp: currentTime,
        emotes: extractEmotes(userstate.emotes, sanitizedMessage),
        isFirstMessage: userstate['first-msg'],
        isAnnouncement: userstate.announcement,
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userstate, message]);

  return (
    <ScrollView style={[styles.chatContainer, style]}>
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
            {msg.username}
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 5,
    width: '100%',
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
    flexShrink: 0,
  },
  messageText: {
    color: '#FFF',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  timestamp: {
    color: theme.colors.border,
    marginRight: 5,
    flexShrink: 0,
  },
}));
