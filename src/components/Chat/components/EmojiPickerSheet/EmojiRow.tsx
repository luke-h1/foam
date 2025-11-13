import { Button } from '@app/components/Button';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { useMemo } from 'react';
import Animated, {
  SharedValue,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { PickerItem } from './EmojiPickerSheet';
import {
  EMOJI_SIZE,
  CHUNK_SIZE,
  PICKER_GAP,
  EMOJI_RANGE_MARGIN,
  EMOJI_SCALE_RATIO,
} from './config';

export function EmojiRow({
  items,
  index,
  scrollY,
  onPress,
}: {
  items: { emoji: PickerItem; index: number }[];
  index: number;
  scrollY: SharedValue<number>;
  onPress?: (item: PickerItem) => void;
}) {
  const positionY = index * EMOJI_SIZE;
  const { startFade, endFade } = useMemo(() => {
    const chunkHeight = EMOJI_SIZE * CHUNK_SIZE - PICKER_GAP;
    return {
      startFade: chunkHeight - EMOJI_SIZE,
      endFade: chunkHeight,
    };
  }, []);

  const EMOJI_SPAN = useMemo(() => EMOJI_SIZE * EMOJI_RANGE_MARGIN, []);

  const rotateX = useDerivedValue(() => {
    const distanceFromBottom = positionY - scrollY.value;

    const inRange =
      distanceFromBottom > startFade - EMOJI_SPAN &&
      distanceFromBottom <= endFade + EMOJI_SPAN;

    return inRange
      ? interpolate(
          distanceFromBottom,
          [startFade, endFade],
          [0, -Math.PI / 2.5],
          Extrapolation.CLAMP,
        )
      : 0;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 350 }, { rotateX: `${rotateX.value}rad` }],
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      {items.map(itemObj => {
        const isEmote = typeof itemObj.emoji === 'object';

        console.log(itemObj.emoji);

        const content = isEmote ? (
          <Image
            source={(itemObj.emoji as SanitisiedEmoteSet).url}
            style={styles.emoteImage}
            priority="high"
            cachePolicy="memory"
            contentFit="contain"
          />
        ) : (
          <Typography style={styles.emoji}>
            {itemObj.emoji as string}
          </Typography>
        );

        return (
          <Button
            style={styles.emojiContainer}
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            key={`${index}-${itemObj.index}-${isEmote ? (itemObj.emoji as SanitisiedEmoteSet).name : String(itemObj.emoji)}`}
            onPress={() => onPress?.(itemObj.emoji)}
          >
            {content}
          </Button>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create(() => ({
  row: {
    flexDirection: 'row',
    transformOrigin: 'top',
  },
  emoteImage: {
    width: EMOJI_SIZE / EMOJI_SCALE_RATIO,
    height: EMOJI_SIZE / EMOJI_SCALE_RATIO,
  },
  emojiContainer: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: EMOJI_SIZE / EMOJI_SCALE_RATIO,
    textAlign: 'center',
    lineHeight: EMOJI_SIZE,
  },
}));
