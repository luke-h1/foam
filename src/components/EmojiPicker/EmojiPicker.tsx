/* eslint-disable react/display-name */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
  FlatList,
  Pressable,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

// CONFIG
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

export type EmojiPickerProps = {
  data: EmojiSection[];
};

type HeaderItem = {
  type: 'header';
  title: string;
};

type RowItem = {
  type: 'row';
  data: { emoji: string; index: number }[];
};

const getItemLayout = (
  _: ArrayLike<FlatListItem> | null | undefined,
  index: number,
) => ({
  length: EMOJI_SIZE,
  offset: EMOJI_SIZE * index,
  index,
});

type FlatListItem = HeaderItem | RowItem;

type EmojiCell = {
  emoji: string;
  index: number;
};

export type ProcessedEmojiSection = {
  title: string;
  icon: string | string[];
  data: EmojiCell[][];
  index: number;
  sectionOffset: number;
};

export type EmojiSection = {
  title: string;
  icon: string | string[];
  data: string[];
  index?: number;
  sectionOffset?: number;
};

export function processEmojiSections(
  sections: EmojiSection[],
  chunkSize = 6,
): ProcessedEmojiSection[] {
  let globalIndex = 0;

  return sections.map((section, sectionIndex) => {
    const offset = globalIndex;

    const chunked = chunkArray(section.data, chunkSize).map(row =>
      row.map(emoji => ({
        emoji,
        index: globalIndex++,
      })),
    );

    return {
      ...section,
      data: chunked,
      index: sectionIndex,
      sectionOffset: offset,
    };
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function EmojiPicker({ data }: EmojiPickerProps) {
  const flatListRef = useAnimatedRef<FlatList<FlatListItem>>();
  const scrollY = useSharedValue(0);

  const flatData: FlatListItem[] = useMemo(() => {
    const processed = processEmojiSections(data, CHUNK_SIZE);
    const result: FlatListItem[] = [];
    for (const section of processed) {
      result.push({ type: 'header', title: section.title });
      for (const row of section.data) {
        result.push({ type: 'row', data: row });
      }
    }
    return result;
  }, [data]);

  return (
    <View
      style={{
        backgroundColor: '#000',
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
          flatListRef={flatListRef}
        />
      </View>
    </View>
  );
}

function EmojiFlatList({
  data,
  flatData,
  scrollY,
  flatListRef,
}: {
  data: EmojiSection[];
  flatData: FlatListItem[];
  scrollY: SharedValue<number>;
  flatListRef: any;
}) {
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const scrollToSection = useCallback(
    (sectionIndex: number) => {
      const index = flatData.findIndex(
        item =>
          item.type === 'header' && data[sectionIndex].title === item.title,
      );
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: EMOJI_SIZE,
        });
      }
    },
    [flatData, data, flatListRef],
  );

  const renderItem = useMemo(
    () =>
      ({ item, index }: { item: FlatListItem; index: number }) => {
        if (item.type === 'header') {
          if (index > 0)
            return (
              <View style={styles.header}>
                <Text style={styles.headerText}>{item.title}</Text>
              </View>
            );
        } else if (item.type === 'row') {
          return <EmojiRow items={item.data} index={index} scrollY={scrollY} />;
        }
        return null;
      },
    [scrollY],
  );

  return (
    <>
      <EmojiCategoryBar data={data} onPress={scrollToSection} />
      <Animated.FlatList
        ref={flatListRef}
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
        initialNumToRender={CHUNK_SIZE}
        maxToRenderPerBatch={CHUNK_SIZE * 2}
        removeClippedSubviews
        getItemLayout={getItemLayout}
        windowSize={5}
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
  return (
    <ScrollView
      style={[styles.topbar, { backgroundColor: '#000' }]}
      contentContainerStyle={{
        padding: PICKER_PAD,
        gap: 4,
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {data.map((section, index) => (
        <TouchableOpacity
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
          <Text style={styles.icon}>{section.icon}</Text>
        </TouchableOpacity>
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
        const content = <Text style={styles.emoji}>{emojiObj.emoji}</Text>;
        return (
          <Pressable
            style={styles.emojiContainer}
            key={emojiObj.index}
            onPress={() => onPress?.(emojiObj.emoji)}
            // android_ripple={{
            //   color: text + "90",
            // }}
          >
            {content}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    ...TOP_CORNER_STYLE,
  },
  icon: {
    fontSize: EMOJI_SIZE / (PICKER_PAD / 2.5),
  },
  row: {
    flexDirection: 'row',
    transformOrigin: 'top',
  },
});
