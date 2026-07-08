import { memo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { BLURHASH } from '@app/utils/image/image-cache';

import { EmoteImageShimmer } from './EmoteImageShimmer';
import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';

// Picker cells render at ~40pt; the 2x variant keeps the sheet from decoding
// hundreds of 4x animated AVIFs at once (see issue #594 profiling).
function getEmoteCellDisplayUrl(item: Exclude<EmotePickerItem, string>) {
  const resolved = withResolvedEmoteImageVariants(item);
  return (
    getDisplayEmoteUrl({
      image_variants: resolved.image_variants,
      url: resolved.url,
      static_url: resolved.static_url,
      preferredScale: '2x',
    }) || item.url
  );
}

function EmoteCellComponent({
  cellSize,
  item,
  onPress,
}: {
  cellSize: number;
  item: EmotePickerItem;
  onPress: (item: EmotePickerItem) => void;
}) {
  const innerSize = Math.round(cellSize * 0.78);
  const imageUrl =
    typeof item === 'string' ? null : getEmoteCellDisplayUrl(item);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const isImageLoaded = loadedImageUrl === imageUrl;

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
          <>
            {!isImageLoaded ? <EmoteImageShimmer size={innerSize} /> : null}
            <Image
              source={imageUrl ?? item.url}
              style={[
                styles.emoteImage,
                !isImageLoaded && styles.emoteImageLoading,
                { height: innerSize, width: innerSize },
              ]}
              containerStyle={styles.emoteImageContainer}
              contentFit='contain'
              cacheToFile={false}
              cachePolicy='memory-disk'
              cacheVariant='emote'
              transition={0}
              placeholder={BLURHASH}
              recyclingKey={item.id}
              onError={() => imageUrl && setLoadedImageUrl(imageUrl)}
              onLoadEnd={() => imageUrl && setLoadedImageUrl(imageUrl)}
            />
          </>
        )}
      </View>
    </Button>
  );
}

export const EmoteCell = memo(EmoteCellComponent, (prev, next) => {
  if (prev.cellSize !== next.cellSize || prev.onPress !== next.onPress) {
    return false;
  }
  if (typeof prev.item === 'string' || typeof next.item === 'string') {
    return prev.item === next.item;
  }
  return prev.item.id === next.item.id;
});
