import { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';

import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { chatSheetStyles } from '@app/components/chat/components/sheet/ChatSheet.styles';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { useChatSheetHeight } from '@app/components/chat/components/sheet/hooks/use-chat-sheet-height';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  CHAT_SETTINGS_SHEET_DETENT,
  type ChatSheetLayout,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import { FlashList } from '@app/components/flash-list/FlashList';
import { PressableArea } from '@app/components/pressable-area/PressableArea';
import { EmptyState } from '@app/components/ui/empty-state/EmptyState';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { type SavedPhrase, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

interface SavedPhrasesSheetProps {
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

const SHEET_LAYOUT: ChatSheetLayout = {
  fraction: CHAT_SETTINGS_SHEET_DETENT,
  kind: 'fraction',
};

const SavedPhrasesSheetComponent = ({
  onDismiss,
  onSelectPhrase,
}: SavedPhrasesSheetProps) => {
  const {
    bottom: bottomInset,
    left: leftInset,
    right: rightInset,
  } = useSafeAreaInsets();
  const sheetHeight = useChatSheetHeight(SHEET_LAYOUT);
  const phrases = usePreference('savedPhrases');
  const { requestClose, runAndClose, sheetRef } = useChatSheet();

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: bottomInset + theme.space24,
        paddingLeft: leftInset,
        paddingRight: rightInset,
      },
    ],
    [bottomInset, leftInset, rightInset],
  );

  const pendingManageRef = useRef(false);

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
    (text: string) => runAndClose(() => onSelectPhrase(text)),
    [onSelectPhrase, runAndClose],
  );

  const renderItem: ListRenderItem<SavedPhrase> = useCallback(
    ({ item }) => (
      <SavedPhraseRow phrase={item} onSelect={handleSelectPhrase} />
    ),
    [handleSelectPhrase],
  );

  return (
    <ChatSheet
      ref={sheetRef}
      onDismiss={handleDismiss}
      layout={SHEET_LAYOUT}
      testID='chat-saved-phrases-sheet'
    >
      <View style={[chatSheetStyles.listContainer, { height: sheetHeight }]}>
        <View style={styles.header}>
          <SheetHeader
            title='Saved phrases'
            {...{
              action:
                phrases.length > 0
                  ? { label: 'Edit', onPress: handleManage }
                  : undefined,
              onClose: requestClose,
            }}
          />
        </View>

        {phrases.length === 0 ? (
          <EmptyState
            iconName='text.bubble'
            heading='No saved phrases yet'
            content='Save phrases you type often. Tap one to insert it.'
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
    </ChatSheet>
  );
};

export const SavedPhrasesSheet = memo(SavedPhrasesSheetComponent);

const styles = StyleSheet.create({
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
