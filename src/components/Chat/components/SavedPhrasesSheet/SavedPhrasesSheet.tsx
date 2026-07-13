import { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { FlashList } from '@app/components/FlashList/FlashList';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { type SavedPhrase, usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';

import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';
import { chatSheetSurface } from '../chatSheetSurface';

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
    <Button style={styles.row} onPress={() => onSelect(phrase.text)}>
      <Text style={styles.phraseText} numberOfLines={2}>
        {phrase.text}
      </Text>
      <SymbolView
        name='arrow.up.left'
        size={18}
        tintColor={theme.colorGreyHoverAlpha}
      />
    </Button>
  );
}

const SavedPhrasesSheetComponent = ({
  isPresented,
  onDismiss,
  onSelectPhrase,
}: SavedPhrasesSheetProps) => {
  const { t } = useTranslation(['preferences', 'navigation']);
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
          <Text style={styles.headerTitle} weight='semibold'>
            {t('savedPhrasesSheetTitle')}
          </Text>
          <Button onPress={handleManage} hitSlop={8}>
            <SymbolView
              name='gearshape'
              size={20}
              tintColor={theme.colorGreyHoverAlpha}
            />
          </Button>
        </View>

        {phrases.length === 0 ? (
          <View style={styles.emptyState}>
            <SymbolView
              name='text.bubble'
              size={44}
              tintColor={theme.colorGreyHoverAlpha}
            />
            <Text style={styles.emptyTitle} weight='medium'>
              {t('savedPhrasesSheetEmpty')}
            </Text>
            <Text style={styles.emptyHint}>
              {t('savedPhrasesSheetEmptyHint')}
            </Text>
            <Button style={styles.manageButton} onPress={handleManage}>
              <Text style={styles.manageButtonLabel} weight='medium'>
                {t('manageSavedPhrases')}
              </Text>
            </Button>
          </View>
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
    backgroundColor: theme.color.background.dark,
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  },
  emptyHint: {
    color: theme.colorGreyHoverAlpha,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space12,
    justifyContent: 'center',
    paddingHorizontal: theme.space28,
  },
  emptyTitle: {
    fontSize: theme.fontSize16,
    marginTop: theme.space4,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
  },
  headerTitle: {
    fontSize: theme.fontSize20,
  },
  listContent: {
    paddingHorizontal: theme.space20,
    paddingTop: theme.space8,
  },
  manageButton: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    marginTop: theme.space8,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  manageButtonLabel: {
    fontSize: theme.fontSize14,
  },
  phraseText: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingVertical: 14,
  },
});
