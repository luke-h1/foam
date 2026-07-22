import { memo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { type ColorScheme, theme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { ParsedPart } from '@app/utils/chat/parsedPart';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';

import { PaintedUsername } from '../ChatMessage/CosmeticUsername/PaintedUsername';

interface MessageActionPreviewProps {
  message: ParsedPart[];
  username?: string;
}

function getMessagePartKey(part: ParsedPart, occurrence: number): string {
  switch (part.type) {
    case 'emote':
      return `emote:${part.url ?? part.content}:${occurrence}`;
    case 'mention':
    case 'text':
      return `${part.type}:${part.content}:${occurrence}`;
    default:
      return `${part.type}:${'content' in part && typeof part.content === 'string' ? part.content : ''}:${occurrence}`;
  }
}

function renderMessagePart(
  part: ParsedPart,
  occurrence: number,
  scheme: ColorScheme,
) {
  const key = getMessagePartKey(part, occurrence);
  const messageTextStyle = [
    styles.messageText,
    { color: theme.color.text[scheme] },
  ];

  switch (part.type) {
    case 'emote':
      if (!part.url) {
        return null;
      }
      return (
        <Image
          key={key}
          trackLoadContext='chat.message-action-sheet'
          source={part.url}
          cacheVariant='emote'
          style={styles.messageEmote}
          contentFit='contain'
          transition={0}
        />
      );
    case 'mention':
    case 'text':
      return (
        <Text key={key} style={messageTextStyle}>
          {part.content}
        </Text>
      );
    default:
      if ('content' in part && typeof part.content === 'string') {
        return (
          <Text key={key} style={messageTextStyle}>
            {part.content}
          </Text>
        );
      }
      return null;
  }
}

export const MessageActionPreview = memo(function MessageActionPreview({
  message,
  username,
}: MessageActionPreviewProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const previewUsernameColor = username
    ? cachedLighten(generateRandomTwitchColor(username))
    : null;
  const partKeyCounts = new Map<string, number>();

  return (
    <View
      style={[
        styles.previewCard,
        {
          backgroundColor: theme.color.surfaceAlpha[scheme],
          borderColor: theme.color.border[scheme],
        },
      ]}
    >
      <View style={styles.messageLine}>
        {username ? (
          <PaintedUsername
            username={username}
            fallbackColor={previewUsernameColor ?? undefined}
            usernameTextStyle={styles.previewUsername}
          />
        ) : null}
        {message.map(part => {
          const baseKey = getMessagePartKey(part, 0).replace(/:\d+$/, '');
          const occurrence = partKeyCounts.get(baseKey) ?? 0;
          partKeyCounts.set(baseKey, occurrence + 1);
          return renderMessagePart(part, occurrence, scheme);
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
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.4,
  },
  previewCard: {
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
