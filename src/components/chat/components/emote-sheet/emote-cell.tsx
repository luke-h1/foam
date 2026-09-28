import { memo, use, useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Image as ExpoImage } from 'expo-image';

import { Text } from '@app/components/ui/text/text';
import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolve-use-apple-webp-codec';
import { runAnimationCommand } from '@app/lib/expo-image/run-animation-command';
import type { SanitisedEmote } from '@app/types/emote';
import { describeEmoteUrl } from '@app/utils/emote/describe-emote-url';

import { RowVisibilityContext } from '../chat-message/util/row-visibility';
import { emoteSheetStyles as styles } from './emote-sheet.styles';
import { getEmotePickerDisplayUrl } from './util/emote-picker-display-url';
import { emoteSheetAnimationBudget } from './util/emote-sheet-animation-budget';
import { emoteSheetScrollActivity } from './util/emote-sheet-scroll-activity';
import type { EmotePickerItem } from './util/emote-sheet-types';

function isEmoteEntry(item: EmotePickerItem): item is SanitisedEmote {
  return Object.prototype.hasOwnProperty.call(item, 'id');
}

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
  const displayUrl = isEmoteEntry(item) ? getEmotePickerDisplayUrl(item) : null;

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

  const isImageItem = isEmoteEntry(item);

  useEffect(() => {
    if (!isImageItem) {
      return undefined;
    }

    let releaseSlot: (() => void) | null = null;

    const applyVisibility = () => {
      const isVisible = rowVisibility?.isVisible() ?? true;

      if (isVisible === (releaseSlot !== null)) {
        return;
      }

      if (releaseSlot) {
        releaseSlot();
        releaseSlot = null;
        hasAnimationSlotRef.current = false;
        syncAnimation();
        return;
      }

      releaseSlot = emoteSheetAnimationBudget.acquire(granted => {
        hasAnimationSlotRef.current = granted;
        syncAnimation();
      });
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

  if (!isEmoteEntry(item)) {
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

  if (!isEmoteEntry(prev.item) || !isEmoteEntry(next.item)) {
    return prev.item === next.item;
  }

  return prev.item.id === next.item.id;
});
