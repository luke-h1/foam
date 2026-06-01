import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PaintedUsername } from '../ChatMessage/CosmeticUsername/CosmeticUsername';

export const MESSAGE_ACTION_PREVIEW_PORTAL_NAME = 'chat-message-action-preview';
export const MESSAGE_ACTION_PREVIEW_PORTAL_INSTANCE_NAME =
  'selected-message-preview';

interface MessageActionPreviewProps {
  message: ParsedPart[];
  username?: string;
}

export const MessageActionPreview = memo(function MessageActionPreview({
  message,
  username,
}: MessageActionPreviewProps) {
  const previewUsernameColor = useMemo(
    () => (username ? lightenColor(generateRandomTwitchColor(username)) : null),
    [username],
  );

  const renderMessagePart = useCallback((part: ParsedPart, index: number) => {
    switch (part.type) {
      case 'emote':
        if (!part.url) {
          return null;
        }
        return (
          <Image
            key={`${part.type}-${part.id ?? index}-${index}`}
            useNitro
            trackLoadTime
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
          <Text key={`${part.type}-${index}`} style={styles.messageText}>
            {part.content}
          </Text>
        );
      default:
        if ('content' in part && typeof part.content === 'string') {
          return (
            <Text key={`${part.type}-${index}`} style={styles.messageText}>
              {part.content}
            </Text>
          );
        }
        return null;
    }
  }, []);

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
        {message.map(renderMessagePart)}
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
