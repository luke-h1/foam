import { memo, use, useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Image as ExpoImage } from 'expo-image';

import { Text } from '@app/components/ui/Text/Text';
import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolveUseAppleWebpCodec';
import { runAnimationCommand } from '@app/lib/expo-image/runAnimationCommand';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';

import { RowVisibilityContext } from '../ChatMessage/rowVisibility';
import { emoteSheetStyles as styles } from './EmoteSheet.styles';
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
  const rowVisibility = use(RowVisibilityContext);

  const syncAnimation = useCallback(() => {
    const shouldAnimate =
      hasAnimationSlotRef.current && !emoteSheetScrollActivity.isActive();
    runAnimationCommand(
      imageRef.current,
      shouldAnimate ? 'startAnimating' : 'stopAnimating',
    );
  }, []);

  const isImageItem = typeof item !== 'string';
  useEffect(() => {
    if (!isImageItem) {
      return undefined;
    }

    /**
     * Hold the slot only while the row is on screen. Slots used to be taken on
     * mount, and the list keeps several screens of rows mounted, so the cap was
     * spent on offscreen cells and most of what the user could see never
     * animated.
     */
    let releaseSlot: (() => void) | null = null;
    const applyVisibility = () => {
      const isVisible = rowVisibility?.isVisible() ?? true;

      if (isVisible && !releaseSlot) {
        releaseSlot = emoteSheetAnimationBudget.acquire(granted => {
          hasAnimationSlotRef.current = granted;
          syncAnimation();
        });
        return;
      }

      if (!isVisible && releaseSlot) {
        releaseSlot();
        releaseSlot = null;
        hasAnimationSlotRef.current = false;
        syncAnimation();
      }
    };

    applyVisibility();
    const unsubscribeVisibility = rowVisibility?.subscribe(applyVisibility);
    const unsubscribeScroll = emoteSheetScrollActivity.subscribe(syncAnimation);

    return () => {
      unsubscribeScroll();
      unsubscribeVisibility?.();
      releaseSlot?.();
      hasAnimationSlotRef.current = false;
    };
  }, [isImageItem, rowVisibility, syncAnimation]);

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
        // `startAnimating` acts on the view's current image, so the slot the
        // cell takes on mount is a no-op until one is decoded - and `autoplay`
        // is off, so nothing starts it afterwards. Re-issuing the command once
        // the image is on screen is what actually plays it.
        onDisplay={syncAnimation}
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
