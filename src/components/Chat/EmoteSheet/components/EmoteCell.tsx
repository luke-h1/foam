import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { BLURHASH } from '@app/utils/image/image-cache';
import { View } from 'react-native';
import { emoteSheetStyles as styles } from '../emoteSheetStyles';
import type { SanitisedEmote } from '@app/types/emote';

export type EmotePickerItem = string | SanitisedEmote;

export function EmoteCell({
  cellSize,
  item,
  onPress,
}: {
  cellSize: number;
  item: EmotePickerItem;
  onPress: (item: EmotePickerItem) => void;
}) {
  const innerSize = Math.round(cellSize * 0.78);

  return (
    <Button
      style={[styles.emoteCell, { height: cellSize, width: cellSize }]}
      onPress={() => onPress(item)}
    >
      <View
        style={[styles.emoteCellInner, { height: innerSize, width: innerSize }]}
      >
        {typeof item === 'string' ? (
          <Text style={[styles.emojiText, { fontSize: innerSize * 0.84 }]}>
            {item}
          </Text>
        ) : (
          <Image
            source={item.url}
            style={[styles.emoteImage, { height: innerSize, width: innerSize }]}
            containerStyle={styles.emoteImageContainer}
            contentFit='contain'
            cacheToFile={false}
            cachePolicy='memory-disk'
            cacheVariant='emote'
            placeholder={BLURHASH}
            recyclingKey={item.id}
          />
        )}
      </View>
    </Button>
  );
}
