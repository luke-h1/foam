import { memo } from 'react';
import { View } from 'react-native';

import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { BLURHASH } from '@app/utils/image/image-cache';

import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';

const displayUrlCache = new WeakMap<Exclude<EmotePickerItem, string>, string>();

function getEmoteCellDisplayUrl(item: Exclude<EmotePickerItem, string>) {
  const cached = displayUrlCache.get(item);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = withResolvedEmoteImageVariants(item);
  const url =
    getDisplayEmoteUrl({
      image_variants: resolved.image_variants,
      url: resolved.url,
      static_url: resolved.static_url,
      preferredScale: '2x',
    }) || item.url;

  displayUrlCache.set(item, url);
  return url;
}

function EmoteCellComponent({
  cellSize,
  item,
}: {
  cellSize: number;
  item: EmotePickerItem;
}) {
  const innerSize = Math.round(cellSize * 0.78);

  return (
    <View
      accessible
      accessibilityRole='image'
      accessibilityLabel={typeof item === 'string' ? item : item.name}
      style={[styles.emoteCell, { height: cellSize, width: cellSize }]}
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
            source={getEmoteCellDisplayUrl(item)}
            style={[styles.emoteImage, { height: innerSize, width: innerSize }]}
            containerStyle={styles.emoteImageContainer}
            contentFit='contain'
            cacheToFile={false}
            cachePolicy='memory-disk'
            cacheVariant='emote'
            transition={0}
            placeholder={BLURHASH}
            recyclingKey={item.id}
          />
        )}
      </View>
    </View>
  );
}

export const EmoteCell = memo(EmoteCellComponent, (prev, next) => {
  if (prev.cellSize !== next.cellSize) {
    return false;
  }
  if (typeof prev.item === 'string' || typeof next.item === 'string') {
    return prev.item === next.item;
  }
  return (
    prev.item.id === next.item.id &&
    getEmoteCellDisplayUrl(prev.item) === getEmoteCellDisplayUrl(next.item)
  );
});
