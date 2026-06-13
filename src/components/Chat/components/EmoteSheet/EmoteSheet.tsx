import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Text } from '@app/components/ui/Text/Text';
import { LegendList } from '@legendapp/list';
import { theme } from '@app/styles/themes';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmoteSearchFilter } from './EmoteSearchFilter';
import { EmoteSheetIosBlur } from './EmoteSheetIosBlur';
import { renderProviderChip } from './EmoteSheetProviderChip';
import { renderSetRailItem } from './EmoteSheetSetRailItem';
import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';

export type { EmotePickerItem };
import { useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { LegendListRef } from '@legendapp/list';
import { EMOTE_SHEET_DETENT } from './emoteSheetLayout';
import { useEmoteSheet } from './useEmoteSheet';
import { useTranslation } from 'react-i18next';

interface EmoteSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  onEmoteSelect?: (item: EmotePickerItem) => void;
}

const IosBlur = EmoteSheetIosBlur;

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
      <View
        onLayout={handleContainerLayout}
        style={[
          styles.container,
          { paddingBottom: bottomInset + theme.space20 },
        ]}
      >
        <View style={styles.sheetHandleRow}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={styles.header}>
          <IosBlur intensity={32} />
          <LegendList
            data={sheet.providers}
            horizontal
            estimatedItemSize={96}
            keyExtractor={provider => provider.id}
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            renderItem={renderProviderChip}
            extraData={{
              activeProviderId: sheet.activeProviderId,
              onProviderPress: sheet.handleProviderPress,
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providerBarContent}
            style={styles.providerBar}
          />

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
          <View style={styles.body}>
            <View style={styles.contentPane}>
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
                  getEstimatedItemSize={(_index, _item, type) =>
                    type === 'header' ? 44 : sheet.cellSize + 4
                  }
                  onViewableItemsChanged={sheet.onViewableItemsChanged}
                  viewabilityConfig={sheet.viewabilityConfig}
                  contentContainerStyle={styles.listContent}
                  drawDistance={96}
                  recycleItems
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  style={styles.list}
                />
              )}
            </View>

            <View style={styles.rail}>
              <IosBlur intensity={28} />
              <LegendList
                data={sheet.filteredSets}
                estimatedItemSize={44}
                keyExtractor={set => set.id}
                nestedScrollEnabled
                renderItem={renderSetRailItem}
                extraData={{
                  activeSetId: sheet.activeSetId,
                  onScrollToSet: sheet.handleScrollToSet,
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.railContent}
              />
            </View>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
