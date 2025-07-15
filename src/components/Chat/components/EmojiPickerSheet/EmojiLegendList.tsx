import { Typography } from '@app/components/Typography';
import { LegendListRef } from '@legendapp/list';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { RefObject, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
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
        legendListRef?.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: EMOJI_SIZE,
        });
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
                <Typography style={styles.headerText}>{item.title}</Typography>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      />
    </>
  );
}

const stylesheet = createStyleSheet(() => ({
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
}));
