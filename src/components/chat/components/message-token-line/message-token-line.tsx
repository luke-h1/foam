import {
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/utils/chat/message-token';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolve-emote-display-url';

function getMessagePartKey(token: MessageToken): string {
  if (token.type === 'emote' && token.url) {
    return `emote:${token.url}`;
  }

  return `${token.type}:${'content' in token ? token.content : ''}`;
}

function renderMessagePart(
  token: MessageToken,
  key: string,
  emoteStyle: ImageStyle,
  textStyle: StyleProp<TextStyle>,
) {
  if (token.type === 'emote') {
    const displayUrl = resolveEmoteDisplayUrl(token);

    return displayUrl ? (
      <Image
        key={key}
        trackLoadContext='chat.message-token-line'
        source={displayUrl}
        cacheVariant='emote'
        style={emoteStyle}
        contentFit='contain'
        transition={0}
      />
    ) : null;
  }

  if (!('content' in token)) {
    return null;
  }

  return (
    <Text key={key} family='brand' style={textStyle}>
      {token.content}
    </Text>
  );
}

interface MessageTokenLineProps {
  tokens: MessageToken[];
  /**
   * Content placed before the tokens on the same line, such as a username
   * or a timestamp.
   */
  children?: ReactNode;
  emoteSize?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A chat message outside the list: text, mentions and emote images wrapped
 * on one flowing line. Used by the message action preview and the user
 * sheet's recent messages.
 */
export function MessageTokenLine({
  tokens,
  children,
  emoteSize = 24,
  textStyle,
  style,
}: MessageTokenLineProps) {
  const partKeyCounts = new Map<string, number>();
  const emoteStyle = {
    height: emoteSize,
    marginHorizontal: 2,
    width: emoteSize,
  };
  const resolvedTextStyle = [styles.text, textStyle];

  return (
    <View style={[styles.line, style]}>
      {children}
      {tokens.map(token => {
        const baseKey = getMessagePartKey(token);
        const occurrence = partKeyCounts.get(baseKey) ?? 0;
        partKeyCounts.set(baseKey, occurrence + 1);

        return renderMessagePart(
          token,
          `${baseKey}:${occurrence}`,
          emoteStyle,
          resolvedTextStyle,
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    lineHeight: 22,
  },
});
