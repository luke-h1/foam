import { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/bottom-sheet';
import { SheetHeader } from '@app/components/chat/components/sheet/sheet-header';
import { CHAT_SETTINGS_SHEET_DETENT } from '@app/components/chat/util/chat-sheet-layout';
import { chatSheetSurface } from '@app/components/chat/util/chat-sheet-surface';
import { FlashList } from '@app/components/flash-list/flash-list';
import { PressableArea } from '@app/components/pressable-area/pressable-area';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { type SavedPhrase, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

export interface SavedPhrasesSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  onSelectPhrase: (text: string) => void;
}

function SavedPhraseRow({
  phrase,
  onSelect,
}: {
  phrase: SavedPhrase;
  onSelect: (text: string) => void;
}) {
  return (
    <PressableArea
      feedback='highlight'
      accessibilityLabel={`Insert ${phrase.text}`}
      onPress={() => onSelect(phrase.text)}
    >
      <View style={styles.row}>
        <Text
          type='callout'
          family='brand'
          style={styles.phraseText}
          numberOfLines={2}
        >
          {phrase.text}
        </Text>
        <SymbolView
          name='arrow.up.left'
          size={15}
          tintColor={theme.color.textSecondary.dark}
        />
      </View>
    </PressableArea>
  );
}

const SavedPhrasesSheetComponent = ({
  isPresented,
  onDismiss,
  onSelectPhrase,
}: SavedPhrasesSheetProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * CHAT_SETTINGS_SHEET_DETENT);
  const savedPhrases = usePreference('savedPhrases');
  const phrases = savedPhrases ?? [];
  const sheetRef = useRef<BottomSheetHandle>(null);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: bottomInset + theme.space24 }],
    [bottomInset],
  );

  const pendingManageRef = useRef(false);

  const requestClose = useCallback(() => {
    sheetRef.current?.requestClose();
  }, []);

  const handleDismiss = useCallback(() => {
    onDismiss();
    if (pendingManageRef.current) {
      pendingManageRef.current = false;
      router.push('/tabs/settings/saved-phrases');
    }
  }, [onDismiss]);

  const handleManage = useCallback(() => {
    pendingManageRef.current = true;
    requestClose();
  }, [requestClose]);

  const handleSelectPhrase = useCallback(
    (text: string) => {
      onSelectPhrase(text);
      requestClose();
    },
    [onSelectPhrase, requestClose],
  );

  const renderItem: ListRenderItem<SavedPhrase> = useCallback(
    ({ item }) => (
      <SavedPhraseRow phrase={item} onSelect={handleSelectPhrase} />
    ),
    [handleSelectPhrase],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={isPresented}
      onDismiss={handleDismiss}
      showDragIndicator
      snapPoints={[{ fraction: CHAT_SETTINGS_SHEET_DETENT }]}
      testID='chat-saved-phrases-sheet'
    >
      <View style={[styles.container, { height: sheetHeight }]}>
        <View style={styles.header}>
          <SheetHeader
            title='Saved phrases'
            action={
              phrases.length > 0
                ? { label: 'Edit', onPress: handleManage }
                : undefined
            }
            onClose={requestClose}
          />
        </View>

        {phrases.length === 0 ? (
          <EmptyState
            iconName='text.bubble'
            heading='No saved phrases yet'
            content='Save phrases you type often, then insert them here with one tap.'
            button='Add a phrase'
            buttonOnPress={handleManage}
          />
        ) : (
          <FlashList
            data={phrases}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listContentStyle}
          />
        )}
      </View>
    </BottomSheet>
  );
};

export const SavedPhrasesSheet = memo(SavedPhrasesSheetComponent);

const styles = StyleSheet.create({
  container: {
    ...chatSheetSurface,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  },
  header: {
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
  listContent: {
    paddingTop: theme.space4,
  },
  phraseText: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize16,
    lineHeight: 21,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 50,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
