import { Text } from '@app/components/Text';
import { LegendListRef } from '@legendapp/list';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { RefObject, useCallback, useMemo, useState } from 'react';
import { View, ViewToken, ViewabilityConfig } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { EmojiCategoryBar } from './EmojiCategoryBar';
import { FlatListItem, PickerItem, TOP_CORNER_STYLE } from './EmojiPickerSheet';
import { EmojiRow } from './EmojiRow';
import {
  EmojiSection,
  EMOJI_SIZE,
  CATEGORY_HEADER_HEIGHT,
  PICKER_GAP,
} from './config';

export function EmojiLegendList({
  data,
  flatData,
  scrollY,
  legendListRef,
  onItemPress,
  activeSection,
  onSectionPress,
  showSubNavigation,
}: {
  data: EmojiSection[];
  flatData: FlatListItem[];
  scrollY: SharedValue<number>;
  legendListRef: RefObject<LegendListRef | null>;
  onItemPress?: (item: PickerItem) => void;
  activeSection: number;
  onSectionPress: (sectionIndex: number) => void;
  showSubNavigation?: boolean;
}) {
  // Add this state to track if we're programmatically scrolling
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      // eslint-disable-next-line no-param-reassign
      scrollY.value = event.contentOffset.y;
    },
  });

  const viewabilityConfig = useMemo(
    (): ViewabilityConfig => ({
      viewAreaCoveragePercentThreshold: 50,
      minimumViewTime: 50,
    }),
    [],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Only update active section if we're not programmatically scrolling
      if (isScrolling) return;

      const visibleHeader = viewableItems.find(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        item => item.item?.type === 'header',
      );

      if (visibleHeader) {
        const sectionIndex = data.findIndex(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          section => section.title === visibleHeader.item.title,
        );
        if (sectionIndex !== -1) {
          onSectionPress(sectionIndex);
        }
      }
    },
    [data, onSectionPress, isScrolling],
  );

  const scrollToSection = useCallback(
    (sectionIndex: number) => {
      const index = flatData.findIndex(
        item =>
          item.type === 'header' && data[sectionIndex]?.title === item.title,
      );
      if (index !== -1) {
        /**
         * Set scrolling state before scroll to avoid flicker
         * between original selected category and new one
         */
        setIsScrolling(true);
        legendListRef?.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: EMOJI_SIZE,
        });
        setTimeout(() => setIsScrolling(false), 300);
      }
      onSectionPress(sectionIndex);
    },
    [flatData, data, legendListRef, onSectionPress],
  );

  const renderItem = useMemo(
    () =>
      // eslint-disable-next-line react/no-unstable-nested-components, react/display-name
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
              // @ts-expect-error - TODO: fix this
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
      <AnimatedLegendList
        ref={legendListRef}
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
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </>
  );
}

const styles = StyleSheet.create(() => ({
  header: {
    height: EMOJI_SIZE,
    justifyContent: 'center',
  },
  headerText: {
    textAlign: 'center',
    opacity: 0.6,
    color: '#fff',
  },
}));
