import { memo } from 'react';
import { View } from 'react-native';

import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { BLURHASH } from '@app/utils/image/image-cache';

import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';

// The resolved URL only depends on the emote object, which is stable for an
// emote's lifetime, so cache per-item. The comparator below and the render body
// both ask for this on every recycle during a fling; without the cache each call
// re-runs variant regex matching + URL construction, which shows up as dropped
// frames while scrolling a busy sheet.
const displayUrlCache = new WeakMap<Exclude<EmotePickerItem, string>, string>();

// Picker cells render at ~40pt; the 2x variant keeps the sheet from decoding
// hundreds of 4x animated AVIFs at once (see issue #594 profiling).
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

  // Taps are handled once at the row level (see EmoteRow), so the cell is a
  // plain View. It stays `accessible` with a label so a screen reader still
  // announces each emote by name while scrolling the grid.
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
          // expo-image owns the loading state: `recyclingKey` keeps the last
          // decoded frame on screen across a recycle, and the blurhash
          // placeholder only shows for genuinely-uncached emotes. Gating the
          // image behind our own `loaded` state instead flashed a shimmer on
          // every recycled cell during a fling (state carried the prior item's
          // URL until onLoadEnd re-fired), which is what caused blank cells.
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
