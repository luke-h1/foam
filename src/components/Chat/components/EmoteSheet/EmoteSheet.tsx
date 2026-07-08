import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegendList } from '@legendapp/list/react-native';

import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { EmoteSearchFilter } from './EmoteSearchFilter';
import { EmoteSheetIosBlur } from './EmoteSheetIosBlur';
import { renderSetRailItem } from './EmoteSheetSetRailItem';
import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';
import { ProviderChip } from './ProviderChip';
import { emoteSheetScrollActivity } from './util/emoteSheetScrollActivity';

export type { EmotePickerItem };
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent } from 'react-native';

import type { LegendListRef } from '@legendapp/list/react-native';

import { EMOTE_SHEET_DETENT } from './emoteSheetLayout';
import { useEmoteSheet } from './useEmoteSheet';

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
  const [layoutWidth, setLayoutWidth] = useState(0);
  const sheet = useEmoteSheet({
    isPresented,
    onDismiss,
    onEmoteSelect,
    emoteListRef,
    layoutWidth,
  });

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setLayoutWidth(current => (current === nextWidth ? current : nextWidth));
    }
  };

  return (
    <BottomSheet
      enableFixedSnapPoints
      isPresented={isPresented}
      onDismiss={sheet.handleDismiss}
      snapPoints={[{ fraction: EMOTE_SHEET_DETENT }]}
      testID='chat-emote-sheet'
    >
      <View onLayout={handleContainerLayout} style={styles.container}>
        <View style={styles.sheetHandleRow}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={styles.header}>
          <EmoteSheetIosBlur />
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
                  keyExtractor={item => item.key}
                  getItemType={item => item.type}
                  estimatedItemSize={sheet.cellSize + 4}
                  getFixedItemSize={(_item, _index, type) =>
                    type === 'header' ? 44 : sheet.cellSize + 4
                  }
                  onViewableItemsChanged={sheet.onViewableItemsChanged}
                  viewabilityConfig={sheet.viewabilityConfig}
                  onScroll={emoteSheetScrollActivity.poke}
                  scrollEventThrottle={16}
                  contentContainerStyle={[
                    styles.listContent,
                    {
                      paddingBottom:
                        theme.space36 +
                        (sheet.filteredSets.length > 1 ? 0 : bottomInset),
                    },
                  ]}
                  drawDistance={(sheet.cellSize + 4) * 8}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                  indicatorStyle='white' // todo - once we have light theme, adjust this
                  style={styles.list}
                />
              )}
            </View>

            {sheet.filteredSets.length > 1 ? (
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
                  extraData={{
                    activeSetId: sheet.activeSetId,
                    onScrollToSet: sheet.handleScrollToSet,
                  }}
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
