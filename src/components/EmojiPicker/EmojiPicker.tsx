/* eslint-disable no-restricted-imports */
/* eslint-disable react/display-name */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
import { useCallback, useMemo, useState } from 'react';
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
import { useStyles } from 'react-native-unistyles';
import { Image } from '@app/components';
import { SanitisiedEmoteSet } from '../../services/seventTvService';

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

// Generic types for flexible data support
export type PickerItem = string | SanitisiedEmoteSet;

export type EmojiPickerProps = {
  data: EmojiSection[];
  onItemPress?: (item: PickerItem) => void;
  showSubNavigation?: boolean;
  onSubNavigationChange?: (subKey: string) => void;
  activeSubNavigation?: string;
  subNavigationOptions?: SubNavigationOption[];
};

export type SubNavigationOption = {
  key: string;
  label: string;
  icon?: string;
};

type HeaderItem = {
  type: 'header';
  title: string;
};

type RowItem = {
  type: 'row';
  data: { item: PickerItem; index: number }[];
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

type PickerCell = {
  item: PickerItem;
  index: number;
};

export type ProcessedEmojiSection = {
  title: string;
  icon: string | string[];
  data: PickerCell[][];
  index: number;
  sectionOffset: number;
};

export type EmojiSection = {
  title: string;
  icon: string | string[];
  data: PickerItem[];
  index?: number;
  sectionOffset?: number;
};

export function processEmojiSections(
  sections: EmojiSection[],
  chunkSize = 6,
): ProcessedEmojiSection[] {
  let globalIndex = 0;

  // Filter out empty sections to avoid blank spaces
  const nonEmptySections = sections.filter(section => section.data.length > 0);

  return nonEmptySections.map((section, sectionIndex) => {
    const offset = globalIndex;

    const chunked = chunkArray(section.data, chunkSize).map(row =>
      row.map(item => ({
        item,
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

export default function EmojiPicker({
  data,
  onItemPress,
  showSubNavigation = false,
  onSubNavigationChange,
  activeSubNavigation = 'all',
  subNavigationOptions = [],
}: EmojiPickerProps) {
  const flatListRef = useAnimatedRef<FlatList<FlatListItem>>();
  const scrollY = useSharedValue(0);
  const { theme } = useStyles();
  const [activeSection, setActiveSection] = useState(0);

  // Filter out empty sections
  const filteredData = useMemo(() => {
    return data.filter(section => section.data.length > 0);
  }, [data]);

  const flatData: FlatListItem[] = useMemo(() => {
    const processed = processEmojiSections(filteredData, CHUNK_SIZE);
    const result: FlatListItem[] = [];
    for (const section of processed) {
      if (section.data.length > 0) {
        result.push({ type: 'header', title: section.title });
        for (const row of section.data) {
          result.push({ type: 'row', data: row });
        }
      }
    }
    return result;
  }, [filteredData]);

  const handleSectionPress = useCallback((sectionIndex: number) => {
    setActiveSection(sectionIndex);
  }, []);

  if (filteredData.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { width: PICKER_WIDTH, height: PICKER_WIDTH },
        ]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No emotes available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.borderNeutral,
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
        {showSubNavigation && subNavigationOptions.length > 0 && (
          <SubNavigationBar
            options={subNavigationOptions}
            activeKey={activeSubNavigation}
            onPress={onSubNavigationChange}
          />
        )}
        <EmojiFlatList
          data={filteredData}
          flatData={flatData}
          scrollY={scrollY}
          flatListRef={flatListRef}
          onItemPress={onItemPress}
          activeSection={activeSection}
          onSectionPress={handleSectionPress}
          showSubNavigation={showSubNavigation}
        />
      </View>
    </View>
  );
}

function SubNavigationBar({
  options,
  activeKey,
  onPress,
}: {
  options: SubNavigationOption[];
  activeKey: string;
  onPress?: (key: string) => void;
}) {
  const { theme } = useStyles();

  return (
    <ScrollView
      style={[styles.subNavBar, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.subNavContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map(option => (
        <TouchableOpacity
          key={option.key}
          onPress={() => onPress?.(option.key)}
          style={[
            styles.subNavItem,
            activeKey === option.key && {
              backgroundColor: theme.colors.borderNeutral,
            },
          ]}
        >
          {option.icon && <Text style={styles.subNavIcon}>{option.icon}</Text>}
          <Text style={[styles.subNavLabel, { color: theme.colors.text }]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function EmojiFlatList({
  data,
  flatData,
  scrollY,
  flatListRef,
  onItemPress,
  activeSection,
  onSectionPress,
  showSubNavigation,
}: {
  data: EmojiSection[];
  flatData: FlatListItem[];
  scrollY: SharedValue<number>;
  flatListRef: any;
  onItemPress?: (item: PickerItem) => void;
  activeSection: number;
  onSectionPress: (index: number) => void;
  showSubNavigation: boolean;
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
      onSectionPress(sectionIndex);
    },
    [flatData, data, flatListRef, onSectionPress],
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
          return (
            <EmojiRow
              items={item.data}
              index={index}
              scrollY={scrollY}
              onPress={onItemPress}
            />
          );
        }
        return null;
      },
    [scrollY, onItemPress],
  );

  const topPadding = showSubNavigation
    ? CATEGORY_HEADER_HEIGHT + 40
    : CATEGORY_HEADER_HEIGHT;

  return (
    <>
      <EmojiCategoryBar
        data={data}
        onPress={scrollToSection}
        activeSection={activeSection}
      />
      <Animated.FlatList
        ref={flatListRef}
        data={flatData}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        onScroll={scrollHandler}
        style={TOP_CORNER_STYLE}
        contentContainerStyle={{
          paddingTop: topPadding,
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
  activeSection,
}: {
  data: EmojiSection[];
  onPress: (index: number) => void;
  activeSection: number;
}) {
  const { theme } = useStyles();

  return (
    <ScrollView
      style={[styles.topbar, { backgroundColor: theme.colors.surfaceNeutral }]}
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
          style={[
            styles.categoryButton,
            activeSection === index && {
              backgroundColor: theme.colors.borderNeutral,
            },
          ]}
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
  items: { item: PickerItem; index: number }[];
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
        const isEmote = typeof itemObj.item === 'object';
        const content = isEmote ? (
          <Image
            source={(itemObj.item as SanitisiedEmoteSet).url}
            style={styles.emoteImage}
            contentFit="contain"
          />
        ) : (
          <Text style={styles.emoji}>{itemObj.item as string}</Text>
        );

        return (
          <Pressable
            style={styles.emojiContainer}
            key={itemObj.index}
            onPress={() => onPress?.(itemObj.item)}
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
  emoteImage: {
    width: EMOJI_SIZE / EMOJI_SCALE_RATIO,
    height: EMOJI_SIZE / EMOJI_SCALE_RATIO,
  },
  header: {
    height: EMOJI_SIZE,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    color: '#fff',
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
  categoryButton: {
    height: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PICKER_RADIUS / 2,
  },
  subNavBar: {
    position: 'absolute',
    top: CATEGORY_HEADER_HEIGHT,
    left: -PICKER_PAD,
    width: PICKER_WIDTH + 2 * PICKER_PAD,
    zIndex: 1,
    height: 40,
  },
  subNavContent: {
    padding: PICKER_PAD,
    gap: 8,
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  subNavIcon: {
    fontSize: 12,
  },
  subNavLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
