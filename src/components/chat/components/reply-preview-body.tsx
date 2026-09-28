import { memo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import type { MessageToken } from '@app/utils/chat/message-token';
import { getMessageTokenText } from '@app/utils/chat/message-token-content';

interface ReplyPreviewBodyProps {
  tokens: MessageToken[];
  textStyle?: StyleProp<TextStyle>;
}

function ReplyPreviewBodyComponent({
  tokens,
  textStyle,
}: ReplyPreviewBodyProps) {
  const keyCounts = new Map<string, number>();

  return (
    <View style={styles.row}>
      {tokens.slice(0, 24).map(token => {
        const isEmote = token.type === 'emote' && Boolean(token.url);
        const content = getMessageTokenText(token);
        const base = isEmote ? `emote:${token.url}` : `text:${content}`;
        const occurrence = keyCounts.get(base) ?? 0;
        keyCounts.set(base, occurrence + 1);
        const key = `${base}:${occurrence}`;

        if (isEmote) {
          return (
            <Image
              key={key}
              source={token.url}
              cacheVariant='emote'
              contentFit='contain'
              transition={100}
              style={styles.emote}
            />
          );
        }

        if (!content) {
          return null;
        }

        return (
          <Text key={key} numberOfLines={1} style={textStyle}>
            {content}
          </Text>
        );
      })}
    </View>
  );
}

export const ReplyPreviewBody = memo(ReplyPreviewBodyComponent);

const styles = StyleSheet.create({
  emote: {
    height: 18,
    marginHorizontal: 1,
    width: 18,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
});
