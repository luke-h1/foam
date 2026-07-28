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
import { emoteSheetAnimationBudget } from './util/emoteSheetAnimationBudget';
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

  const hasAnimationSlotRef = useRef(false);

  useEffect(() => {
    if (typeof item === 'string') {
      return undefined;
    }

    const sync = () => {
      const shouldAnimate =
        hasAnimationSlotRef.current && !emoteSheetScrollActivity.isActive();
      runAnimationCommand(
        imageRef.current,
        shouldAnimate ? 'startAnimating' : 'stopAnimating',
      );
    };

    const releaseSlot = emoteSheetAnimationBudget.acquire(granted => {
      hasAnimationSlotRef.current = granted;
      sync();
    });
    const unsubscribeScroll = emoteSheetScrollActivity.subscribe(sync);

    return () => {
      unsubscribeScroll();
      releaseSlot();
      hasAnimationSlotRef.current = false;
    };
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
        autoplay={false}
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
