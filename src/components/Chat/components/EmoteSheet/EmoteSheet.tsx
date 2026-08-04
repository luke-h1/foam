import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LegendListRef } from '@legendapp/list/react-native';
import { LegendList } from '@legendapp/list/react-native';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { EmoteSearchFilter } from './EmoteSearchFilter';
import { emoteSheetStyles as styles } from './EmoteSheet.styles';
import { EmoteSheetIosBlur } from './EmoteSheetIosBlur';
import {
  EMOTE_CELL_GAP,
  EMOTE_SHEET_DETENT,
  EMOTE_SHEET_HEADER_HEIGHT,
} from './emoteSheetLayout';
import { renderSetRailItem } from './EmoteSheetSetRailItem';
import type { EmotePickerItem } from './emoteSheetTypes';
import { ProviderChip } from './ProviderChip';
import { useEmoteSheet } from './useEmoteSheet';
import type { EmoteMenuListItem } from './util/emoteMenuData';
import { emoteSheetScrollActivity } from './util/emoteSheetScrollActivity';

const keyExtractor = (item: EmoteMenuListItem) => item.key;
const getItemType = (item: EmoteMenuListItem) => item.type;

interface EmoteSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  onEmoteSelect?: (item: EmotePickerItem) => void;
}

export function EmoteSheet({
  isPresented,
  onDismiss,
  onEmoteSelect,
}: EmoteSheetProps) {
  const { t } = useTranslation('chat');
  const { bottom: bottomInset } = useSafeAreaInsets();
  const emoteListRef = useRef<LegendListRef>(null);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const sheet = useEmoteSheet({
    isPresented,
    onDismiss,
    onEmoteSelect: item => {
      onEmoteSelect?.(item);
      sheetRef.current?.requestClose();
    },
    emoteListRef,
    layoutWidth,
  });

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setLayoutWidth(current => (current === nextWidth ? current : nextWidth));
    }
  }, []);

  const emoteRowSize = sheet.cellSize + EMOTE_CELL_GAP;
  const getFixedItemSize = useCallback(
    (_item: EmoteMenuListItem, _index: number, type: string | undefined) =>
      type === 'header' ? EMOTE_SHEET_HEADER_HEIGHT : emoteRowSize,
    [emoteRowSize],
  );

  const hasSetRail = sheet.filteredSets.length > 1;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: theme.space36 + (hasSetRail ? 0 : bottomInset) },
    ],
    [hasSetRail, bottomInset],
  );

  const setRailExtraData = useMemo(
    () => ({
      activeSetId: sheet.activeSetId,
      onScrollToSet: sheet.handleScrollToSet,
    }),
    [sheet.activeSetId, sheet.handleScrollToSet],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={isPresented}
      onDismiss={sheet.handleDismiss}
      showDragIndicator
      snapPoints={[{ fraction: EMOTE_SHEET_DETENT }]}
      testID='chat-emote-sheet'
    >
      <View onLayout={handleContainerLayout} style={styles.container}>
        <View style={styles.header}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps='handled'
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providerBarContent}
            style={styles.providerBar}
          >
            {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- bounded set of provider tabs */}
            {sheet.providers.map(provider => (
              <ProviderChip
                key={provider.id}
                isActive={provider.id === sheet.activeProviderId}
                onSelect={sheet.handleProviderPress}
                provider={provider}
              />
            ))}
          </ScrollView>

          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <EmoteSearchFilter
                placeholder={t('emoteSheet.searchEmotes')}
                onChange={sheet.handleSearchChange}
                onSubmitEditing={() =>
                  sheet.handleSearchChange(sheet.searchQuery)
                }
                rightOnPress={sheet.handleClearSearch}
                value={sheet.searchQuery}
              />
            </View>
          </View>
        </View>

        {sheet.showPlaceholder ? (
          <View style={styles.placeholderContent}>
            <ActivityIndicator size='large' color={theme.color.text.dark} />
          </View>
        ) : (
          <>
            <View style={styles.body}>
              {sheet.showEmpty ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    {t('emoteSheet.noEmotesFound')}
                  </Text>
                  <Text style={styles.emptyStateBody}>
                    {t('emoteSheet.noEmotesFoundHint')}
                  </Text>
                </View>
              ) : (
                <LegendList
                  ref={emoteListRef}
                  data={sheet.listItems}
                  renderItem={sheet.renderItem}
                  keyExtractor={keyExtractor}
                  getItemType={getItemType}
                  estimatedItemSize={emoteRowSize}
                  getFixedItemSize={getFixedItemSize}
                  recycleItems
                  onViewableItemsChanged={sheet.onViewableItemsChanged}
                  viewabilityConfig={sheet.viewabilityConfig}
                  onScroll={emoteSheetScrollActivity.poke}
                  scrollEventThrottle={16}
                  contentContainerStyle={listContentStyle}
                  drawDistance={emoteRowSize * 3}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  indicatorStyle='white' // todo - once we have light theme, adjust this
                  style={styles.list}
                />
              )}
            </View>

            {hasSetRail ? (
              <View
                style={[
                  styles.categoryBar,
                  { paddingBottom: theme.space8 + bottomInset },
                ]}
              >
                <EmoteSheetIosBlur />
                <LegendList
                  data={sheet.filteredSets}
                  horizontal
                  estimatedItemSize={48}
                  keyExtractor={set => set.id}
                  nestedScrollEnabled
                  renderItem={renderSetRailItem}
                  extraData={setRailExtraData}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryBarContent}
                />
              </View>
            ) : null}
          </>
        )}
      </View>
    </BottomSheet>
  );
}
