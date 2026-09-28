import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { MessageToken } from '@app/utils/chat/message-token';
import { lightenColor } from '@app/utils/color/lighten-color';

import { PaintedUsername } from '../chat-message/cosmetic-username/painted-username';

interface MessageActionPreviewProps {
  message: MessageToken[];
  username?: string;
}

function partTextContent(token: MessageToken): string | undefined {
  return 'content' in token ? token.content : undefined;
}

function getMessagePartKey(token: MessageToken, occurrence: number): string {
  switch (token.type) {
    case 'emote':
      return `emote:${token.url ?? token.content}:${occurrence}`;
    case 'mention':
    case 'text':
      return `${token.type}:${token.content}:${occurrence}`;
    default:
      return `${token.type}:${partTextContent(token) ?? ''}:${occurrence}`;
  }
}

function renderMessagePart(token: MessageToken, occurrence: number) {
  const key = getMessagePartKey(token, occurrence);

  switch (token.type) {
    case 'emote':
      if (!token.url) {
        return null;
      }
      return (
        <Image
          key={key}
          trackLoadContext='chat.message-action-sheet'
          source={token.url}
          cacheVariant='emote'
          style={styles.messageEmote}
          contentFit='contain'
          transition={0}
        />
      );
    case 'mention':
    case 'text':
      return (
        <Text key={key} style={styles.messageText}>
          {token.content}
        </Text>
      );
    default: {
      const content = partTextContent(token);

      if (content !== undefined) {
        return (
          <Text key={key} style={styles.messageText}>
            {content}
          </Text>
        );
      }

      return null;
    }
  }
}

export const MessageActionPreview = memo(function MessageActionPreview({
  message,
  username,
}: MessageActionPreviewProps) {
  const previewUsernameColor = username
    ? lightenColor(generateRandomTwitchColor(username))
    : null;

  const partKeyCounts = new Map<string, number>();

  return (
    <View style={styles.previewCard}>
      <View style={styles.messageLine}>
        {username ? (
          <PaintedUsername
            username={username}
            fallbackColor={previewUsernameColor ?? undefined}
            usernameTextStyle={styles.previewUsername}
          />
        ) : null}
        {message.map(token => {
          const baseKey = getMessagePartKey(token, 0).replace(/:\d+$/, '');
          const occurrence = partKeyCounts.get(baseKey) ?? 0;
          partKeyCounts.set(baseKey, occurrence + 1);
          return renderMessagePart(token, occurrence);
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  messageEmote: {
    height: 24,
    marginHorizontal: 2,
    width: 24,
  },
  messageLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.4,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    gap: theme.space8,
    padding: theme.space12,
  },
  previewUsername: {
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.4,
  },
});
