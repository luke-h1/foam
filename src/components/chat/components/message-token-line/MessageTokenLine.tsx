import {
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { Image } from '@app/components/image/Image';
import { Text } from '@app/components/ui/text/Text';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getChatEmoteDisplayUrl } from '@app/utils/emote/getChatEmoteDisplayUrl';

function getMessagePartKey(token: MessageToken): string {
  if (token.type === 'emote' && token.url) {
    return `emote:${token.url}`;
  }

  return `${token.type}:${'content' in token ? token.content : ''}`;
}

interface MessagePartStyle {
  disableAnimations: boolean;
  emoteStyle: ImageStyle;
  textStyle: StyleProp<TextStyle>;
}

function renderMessagePart(
  token: MessageToken,
  key: string,
  { disableAnimations, emoteStyle, textStyle }: MessagePartStyle,
) {
  if (token.type === 'emote') {
    const displayUrl = getChatEmoteDisplayUrl(token, { disableAnimations });

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
  children?: ReactNode;
  emoteSize?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export function MessageTokenLine({
  tokens,
  children,
  emoteSize = 24,
  textStyle,
  style,
}: MessageTokenLineProps) {
  const disableAnimations = usePreference('disableEmoteAnimations');
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

        return renderMessagePart(token, `${baseKey}:${occurrence}`, {
          disableAnimations,
          emoteStyle,
          textStyle: resolvedTextStyle,
        });
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
