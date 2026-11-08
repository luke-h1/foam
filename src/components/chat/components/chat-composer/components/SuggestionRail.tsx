import { type ComponentType, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { SUGGESTION_LIST_CONTENT_STYLE } from '../constants';
import {
  suggestionRailEntering,
  suggestionRailExiting,
} from '../util/suggestionRailAnimations';
import type { SuggestionItemProps } from './SuggestionRail.types';
import { SuggestionRailChrome } from './SuggestionRailChrome';

interface SuggestionListExtra<T> {
  Item: ComponentType<SuggestionItemProps<T>>;
  onSelect: (item: T) => void;
}

function renderSuggestionItem<T>({
  item,
  extraData,
}: LegendListRenderItemProps<T>) {
  const { Item, onSelect }: SuggestionListExtra<T> = extraData;

  return <Item item={item} onSelect={onSelect} />;
}

interface SuggestionRailProps<T> {
  estimatedItemSize: number;
  Item: ComponentType<SuggestionItemProps<T>>;
  items: T[];
  keyExtractor: (item: T) => string;
  onSelect: (item: T) => void;
  title: string;
}

export function SuggestionRail<T>({
  estimatedItemSize,
  Item,
  items,
  keyExtractor,
  onSelect,
  title,
}: SuggestionRailProps<T>) {
  const extraData = useMemo<SuggestionListExtra<T>>(
    () => ({ Item, onSelect }),
    [Item, onSelect],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={styles.rail}
      entering={suggestionRailEntering}
      exiting={suggestionRailExiting}
    >
      <SuggestionRailChrome title={title}>
        <LegendList
          data={items}
          horizontal
          estimatedItemSize={estimatedItemSize}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps='handled'
          extraData={extraData}
          renderItem={renderSuggestionItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={SUGGESTION_LIST_CONTENT_STYLE}
        />
      </SuggestionRailChrome>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rail: {
    bottom: '100%',
    left: 0,
    paddingBottom: 6,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
});
