import { memo, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Image as ExpoImage } from 'expo-image';

import { Text } from '@app/components/ui/Text/Text';
import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolveUseAppleWebpCodec';
import { runAnimationCommand } from '@app/lib/expo-image/runAnimationCommand';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';

import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';
import { getEmotePickerDisplayUrl } from './util/emotePickerDisplayUrl';
import { emoteSheetScrollActivity } from './util/emoteSheetScrollActivity';

function EmoteCellComponent({
  cellSize,
  item,
}: {
  cellSize: number;
  item: EmotePickerItem;
}) {
  const innerSize = Math.round(cellSize * 0.78);
  const dimensions = { height: innerSize, width: innerSize };
  const imageRef = useRef<ExpoImage>(null);
  const displayUrl =
    typeof item === 'string' ? null : getEmotePickerDisplayUrl(item);
  const urlKind = useMemo(
    () => (displayUrl ? describeEmoteUrl(displayUrl).kind : null),
    [displayUrl],
  );

  useEffect(() => {
    if (typeof item === 'string') {
      return undefined;
    }
    if (emoteSheetScrollActivity.isActive()) {
      runAnimationCommand(imageRef.current, 'stopAnimating');
    }
    return emoteSheetScrollActivity.subscribe(active => {
      runAnimationCommand(
        imageRef.current,
        active ? 'stopAnimating' : 'startAnimating',
      );
    });
  }, [item]);

  if (typeof item === 'string') {
    return (
      <View
        accessible
        accessibilityRole='image'
        accessibilityLabel={item}
        style={[styles.emoteCell, { height: cellSize, width: cellSize }]}
      >
        <Text style={[styles.emojiText, { fontSize: innerSize * 0.84 }]}>
          {item}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole='image'
      accessibilityLabel={item.name}
      style={[styles.emoteCell, { height: cellSize, width: cellSize }]}
    >
      <ExpoImage
        ref={imageRef}
        source={displayUrl}
        style={dimensions}
        contentFit='contain'
        cachePolicy='memory-disk'
        decodeFormat='rgb'
        useAppleWebpCodec={resolveUseAppleWebpCodec(urlKind, {
          preferAppleCodecForStatic: true,
        })}
        autoplay={!emoteSheetScrollActivity.isActive()}
        priority='low'
        transition={0}
        recyclingKey={item.id}
      />
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
  return prev.item.id === next.item.id;
});
