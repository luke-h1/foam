import { AnimatedFlashList } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { FlashList } from '../FlashList';
import { Typography } from '../Typography';
import { EmojiSection, processEmojiSections } from './config';

const PICKER_WIDTH = 300;
const PICKER_PAD = 5;
const PICKER_GAP = 12;
const PICKER_RADIUS = 16;
const CHUNK_SIZE = 8;
const EMOJI_SIZE = PICKER_WIDTH / CHUNK_SIZE;
const EMOJI_SCALE_RATIO = 1.3;
const CATEGORY_HEADER_HEIGHT = EMOJI_SIZE + PICKER_PAD;
const EMOJI_RANGE_MARGIN = 1;

const TOP_CORNER_STYLE: ViewStyle = {
  borderTopLeftRadius: PICKER_RADIUS,
  borderTopRightRadius: PICKER_RADIUS,
};

interface EmojiPickerProps {
  data: EmojiSection[];
}

interface RowItem {
  type: 'row';
  data: { emoji: string; index: number }[];
}

interface HeaderItem {
  type: 'header';
  title: string;
}

type FlatListItem = HeaderItem | RowItem;

export function EmojiPicker({ data }: EmojiPickerProps) {
  const barColor = '#2B2B2B';
  const flashListRef = useAnimatedRef<FlashList<FlatListItem>>();
  const scrollY = useSharedValue<number>(0);
  const { styles } = useStyles(stylesheet);

  const flatData: FlatListItem[] = useMemo(() => {
    const processed = processEmojiSections(data, CHUNK_SIZE);
    return processed.flatMap(section => [
      { type: 'header' as const, title: section.title },
      ...section.data.map(row => ({ type: 'row' as const, data: row })),
    ]);
  }, [data]);

  return (
    <View
      style={{
        backgroundColor: barColor,
        paddingHorizontal: PICKER_PAD,
        borderRadius: PICKER_RADIUS,
      }}
    >
      <View
        style={[
          styles.container,
          { width: PICKER_WIDTH, maxHeight: PICKER_WIDTH },
        ]}
      >
        <EmojiFlatList
          data={data}
          flatData={flatData}
          scrollY={scrollY}
          flashListRef={flashListRef}
        />
      </View>
    </View>
  );
}

/**
 * Todo replace with LegendList once we have a custom wrapper around it
 * Credit to https://github.com/Solarin-Johnson/tg-emoji-picker
 * We need to revamp this to work with emojicon providers rather than a fixed list
 */
function EmojiFlatList({
  data,
  flatData,
  scrollY,
  flashListRef,
}: {
  data: EmojiSection[];
  flatData: FlatListItem[];
  scrollY: SharedValue<number>;
  flashListRef: AnimatedRef<FlashList<FlatListItem>>;
}) {
  const { styles } = useStyles(stylesheet);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      // eslint-disable-next-line no-param-reassign
      scrollY.value = event.contentOffset.y;
    },
  });

  const scrollToSection = useCallback(
    (sectionIndex: number) => {
      const index = flatData.findIndex(
        item =>
          item.type === 'header' && data[sectionIndex]?.title === item.title,
      );
      if (index !== -1) {
        flashListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: EMOJI_SIZE,
        });
      }
    },
    [flatData, data, flashListRef],
  );

  const renderItem = useMemo(
    () =>
      // eslint-disable-next-line react/display-name, react/no-unstable-nested-components
      ({ item, index }: { item: FlatListItem; index: number }) => {
        if (item.type === 'header') {
          if (index > 0)
            return (
              <View style={styles.header}>
                <Typography style={styles.headerText}>{item.title}</Typography>
              </View>
            );
        } else if (item.type === 'row') {
          return <EmojiRow items={item.data} index={index} scrollY={scrollY} />;
        }
        return null;
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scrollY],
  );
  return (
    <>
      <EmojiCategoryBar data={data} onPress={scrollToSection} />
      <AnimatedFlashList
        ref={flashListRef}
        data={flatData}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        onScroll={scrollHandler}
        style={TOP_CORNER_STYLE}
        contentContainerStyle={{
          paddingTop: CATEGORY_HEADER_HEIGHT,
          paddingBottom: PICKER_GAP,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    </>
  );
}

function EmojiCategoryBar({
  data,
  onPress,
}: {
  data: EmojiSection[];
  onPress: (index: number) => void;
}) {
  const { styles } = useStyles(stylesheet);

  const barColor = '#ccc';
  return (
    <ScrollView
      style={[styles.topbar, { backgroundColor: barColor }]}
      contentContainerStyle={{
        padding: PICKER_PAD,
        gap: 4,
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {data.map((section, index) => (
        <Button
          key={section.title}
          onPress={() => onPress(index)}
          style={{
            height: '100%',
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: PICKER_RADIUS / 2,
          }}
        >
          <Typography style={styles.icon}>{section.icon}</Typography>
        </Button>
      ))}
    </ScrollView>
  );
}

function EmojiRow({
  items,
  index,
  scrollY,
  onPress,
}: {
  items: { emoji: string; index: number }[];
  index: number;
  scrollY: SharedValue<number>;
  onPress?: (emoji: string) => void;
}) {
  const { styles } = useStyles(stylesheet);
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
      {items.map(emojiObj => {
        const content = (
          <Typography style={styles.emoji}>{emojiObj.emoji}</Typography>
        );
        return (
          <Button
            style={styles.emojiContainer}
            key={emojiObj.index}
            onPress={() => onPress?.(emojiObj.emoji)}
            // android_ripple={{
            //   color: text + "90",
            // }}
          >
            {content}
          </Button>
        );
      })}
    </Animated.View>
  );
}

const stylesheet = createStyleSheet(() => ({
  container: { flex: 1, flexDirection: 'column' },
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
  header: {
    height: EMOJI_SIZE,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
  topbar: {
    position: 'absolute',
    top: 0,
    left: -PICKER_PAD,
    width: PICKER_WIDTH + 2 * PICKER_PAD,
    zIndex: 1,
    height: CATEGORY_HEADER_HEIGHT,
    // ...TOP_CORNER_STYLE,
  },
  icon: {
    fontSize: EMOJI_SIZE / (PICKER_PAD / 2.5),
  },
  row: {
    flexDirection: 'row',
    transformOrigin: 'top',
  },
}));
