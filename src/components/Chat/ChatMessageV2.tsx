/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { SanitisiedEmoteSet } from '@app/services';
import {
  checkUsernameVariations,
  extractEmotes,
  sanitizeInput,
} from '@app/utils/chat';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotesV2';
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

export interface ChatMessageV2Props {
  userstate: ChatUserstate;
  message: ParsedPart[];
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
  const { styles } = useStyles(stylesheet);

  return (
    <ScrollView style={[styles.chatContainer, style]}>
      <View style={styles.messageContainer}>
        <Typography style={styles.timestamp} size="sm">
          {formatDate(new Date(), 'HH:mm')}{' '}
        </Typography>
        <Typography
          size="sm"
          style={[styles.username, { color: userstate.color || '#FFFFFF' }]}
        >
          {userstate.username || 'Unknown'}:
        </Typography>
        {message.map((part, index) => {
          if (part.type === 'text') {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Typography key={index} size="sm" style={styles.messageText}>
                {part.content}
              </Typography>
            );
          }
          if (part.type === 'emote') {
            return (
              <Image
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                source={{ uri: part.url }}
                style={{
                  width: 45,
                  height: 45,
                }}
              />
            );
          }
          if (part.type === 'mention') {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Typography key={index} size="sm" style={[styles.mention, {}]}>
                {part.content}
              </Typography>
            );
          }
          return null;
        })}
      </View>
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
  mention: {
    fontWeight: 'bold',
    color: '#FF4500', // Default mention color
    marginHorizontal: 2,
  },
  emote: {
    width: 25,
    height: 25,
    marginHorizontal: 2, // Add spacing between emotes and text
  },
}));
