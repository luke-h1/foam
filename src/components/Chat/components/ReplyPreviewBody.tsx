import { memo } from 'react';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

interface ReplyPreviewBodyProps {
  parts: ParsedPart[];
  textStyle?: StyleProp<TextStyle>;
}

function ReplyPreviewBodyComponent({
  parts,
  textStyle,
}: ReplyPreviewBodyProps) {
  const keyCounts = new Map<string, number>();

  return (
    <View style={styles.row}>
      {parts.slice(0, 24).map(part => {
        const isEmote = part.type === 'emote' && Boolean(part.url);
        const content = getParsedPartStringContent(part);
        const base = isEmote ? `emote:${part.url}` : `text:${content}`;
        const occurrence = keyCounts.get(base) ?? 0;
        keyCounts.set(base, occurrence + 1);
        const key = `${base}:${occurrence}`;

        if (isEmote) {
          return (
            <Image
              key={key}
              source={part.url}
              cacheVariant='emote'
              contentFit='contain'
              transition={0}
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
