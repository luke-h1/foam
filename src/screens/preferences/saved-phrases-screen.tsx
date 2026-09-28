import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  Host,
  HStack,
  List,
  Section,
  Spacer,
  Text as SwiftText,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  foregroundStyle,
  listStyle,
  onSubmit,
  submitLabel,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';
import { PressableScale } from 'pressto';

import type {
  FlashListRef,
  ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { FlashList } from '@app/components/flash-list/flash-list';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { impact } from '@app/lib/haptics';
import {
  type SavedPhrase,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { Color } from '@app/styles/palette';
import { theme } from '@app/styles/themes';

function createPhraseId(text: string) {
  return `${Date.now()}_${text}`;
}

const EMPTY_PHRASES: SavedPhrase[] = [];

type SavePhraseResult = 'added' | 'duplicate' | 'edited' | 'empty';

function useSavedPhrases() {
  const savedPhrases = usePreference('savedPhrases');
  const updatePreferences = useUpdatePreferences();

  const phrases = savedPhrases ?? EMPTY_PHRASES;

  const savePhrase = (
    rawText: string,
    editingId: string | null,
  ): SavePhraseResult => {
    const text = rawText.trim();
    if (!text) return 'empty';

    if (
      phrases.some(phrase => phrase.id !== editingId && phrase.text === text)
    ) {
      return 'duplicate';
    }

    if (editingId) {
      updatePreferences({
        savedPhrases: phrases.map(phrase =>
          phrase.id === editingId ? { ...phrase, text } : phrase,
        ),
      });

      impact('light');
      return 'edited';
    }

    updatePreferences({
      savedPhrases: [...phrases, { id: createPhraseId(text), text }],
    });

    impact('light');
    return 'added';
  };

  return { phrases, savePhrase, updatePreferences };
}

interface PhraseRowProps {
  phrase: SavedPhrase;
  isEditing: boolean;
  onEdit: (phrase: SavedPhrase) => void;
  onRemove: (id: string) => void;
}

function PhraseRow({ phrase, isEditing, onEdit, onRemove }: PhraseRowProps) {
  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove phrase',
      `Remove "${phrase.text}" from your saved phrases?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            impact('medium');
            onRemove(phrase.id);
          },
        },
      ],
    );
  }, [phrase, onRemove]);

  return (
    <PressableScale
      onPress={() => onEdit(phrase)}
      style={[styles.row, isEditing && styles.rowEditing]}
    >
      <Text type='md' style={styles.phraseText} numberOfLines={2}>
        {phrase.text}
      </Text>
      <PressableScale
        accessibilityLabel='Remove phrase'
        accessibilityRole='button'
        onPress={handleRemove}
        hitSlop={11}
      >
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={Color.zinc[600]}
        />
      </PressableScale>
    </PressableScale>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <SymbolView
        name='text.bubble'
        size={48}
        tintColor={theme.color.textSecondary.dark}
      />
      <Text type='lg' weight='medium' style={styles.emptyTitle}>
        No saved phrases
      </Text>
      <Text type='sm' style={styles.emptySubtitle}>
        Save phrases you send often, then insert them into the composer with a
        tap.
      </Text>
    </View>
  );
}

interface InputSectionProps {
  value: string;
  isEditing: boolean;
  onChangeText: (text: string) => void;
  onSave: () => void;
}

function InputSection({
  value,
  isEditing,
  onChangeText,
  onSave,
}: InputSectionProps) {
  const canSave = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputRow}>
        <TextInput
          autoCorrect
          placeholder='Add a phrase to save…'
          placeholderTextColor={theme.color.textFaint.dark}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSave}
          returnKeyType='done'
          style={styles.input}
        />
        <PressableScale
          onPress={canSave ? onSave : undefined}
          style={[styles.addButton, canSave ? styles.addButtonEnabled : null]}
        >
          <SymbolView
            name={isEditing ? 'checkmark' : 'plus'}
            size={16}
            tintColor={canSave ? theme.colorBlack : theme.color.textFaint.dark}
          />
        </PressableScale>
      </View>
    </View>
  );
}

function NativeSavedPhrasesList() {
  const { phrases, savePhrase, updatePreferences } = useSavedPhrases();
  const [editingId, setEditingId] = useState<string | null>(null);
  const phraseText = useNativeState('');

  const handleNativeSave = () => {
    const result = savePhrase(phraseText.value, editingId);
    if (result === 'empty') return;

    phraseText.value = '';

    if (result === 'edited') {
      setEditingId(null);
    }
  };

  const handleNativeEdit = (phrase: SavedPhrase) => {
    setEditingId(phrase.id);
    phraseText.value = phrase.text;
  };

  const handleDeleteByIndex = (indices: number[]) => {
    const first = phrases[indices[0] ?? -1];

    if (!first) {
      return;
    }

    Alert.alert(
      'Remove phrase',
      `Remove "${first.text}" from your saved phrases?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            impact('medium');
            const removals = new Set(indices);

            const removedEditing = indices.some(
              index => phrases[index]?.id === editingId,
            );

            if (removedEditing) {
              setEditingId(null);
              phraseText.value = '';
            }

            updatePreferences({
              savedPhrases: phrases.filter((_, index) => !removals.has(index)),
            });
          },
        },
      ],
    );
  };

  const hasPhrases = phrases.length > 0;

  return (
    <Host style={styles.keyboardAvoid} colorScheme='dark'>
      <List modifiers={[listStyle('insetGrouped')]}>
        <Section>
          <TextField
            text={phraseText}
            placeholder='Add a phrase to save…'
            modifiers={[
              textInputAutocapitalization('sentences'),
              submitLabel('done'),
              onSubmit(handleNativeSave),
            ]}
          />
        </Section>
        {hasPhrases ? (
          <Section
            footer={
              <SwiftText>
                {`${phrases.length} ${phrases.length === 1 ? 'phrase' : 'phrases'} · Tap a phrase in chat to insert it.`}
              </SwiftText>
            }
          >
            <List.ForEach onDelete={handleDeleteByIndex}>
              {phrases.map(phrase => (
                <Button
                  key={phrase.id}
                  onPress={() => handleNativeEdit(phrase)}
                  modifiers={[buttonStyle('plain')]}
                >
                  <HStack>
                    <SwiftText
                      modifiers={[foregroundStyle(theme.color.text.dark)]}
                    >
                      {phrase.text}
                    </SwiftText>
                    <Spacer />
                  </HStack>
                </Button>
              ))}
            </List.ForEach>
          </Section>
        ) : (
          <Section title='No saved phrases'>
            <SwiftText
              modifiers={[foregroundStyle(theme.color.textSecondary.dark)]}
            >
              Save a phrase. Then tap it in chat to send it without having to
              re-type it
            </SwiftText>
          </Section>
        )}
      </List>
    </Host>
  );
}

export function SavedPhrasesScreen() {
  const { phrases, savePhrase, updatePreferences } = useSavedPhrases();
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<FlashListRef<SavedPhrase>>(null);

  useScrollToTop(listRef);

  const handleSave = () => {
    const result = savePhrase(inputValue, editingId);
    if (result === 'empty') return;

    setInputValue('');

    if (result === 'edited') {
      setEditingId(null);
    }
  };

  const handleEdit = useCallback((phrase: SavedPhrase) => {
    setEditingId(phrase.id);
    setInputValue(phrase.text);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      if (id === editingId) {
        setEditingId(null);
        setInputValue('');
      }
      updatePreferences({
        savedPhrases: phrases.filter(phrase => phrase.id !== id),
      });
    },
    [editingId, phrases, updatePreferences],
  );

  const renderItem: ListRenderItem<SavedPhrase> = useCallback(
    ({ item }) => (
      <PhraseRow
        phrase={item}
        isEditing={item.id === editingId}
        onEdit={handleEdit}
        onRemove={handleRemove}
      />
    ),
    [editingId, handleEdit, handleRemove],
  );

  const inputSection = (
    <InputSection
      value={inputValue}
      isEditing={editingId !== null}
      onChangeText={setInputValue}
      onSave={handleSave}
    />
  );

  const hasPhrases = phrases.length > 0;

  if (Platform.OS === 'ios') {
    return <NativeSavedPhrasesList />;
  }

  return (
    <KeyboardAvoidingView behavior='padding' style={styles.keyboardAvoid}>
      <FlashList
        ref={listRef}
        data={phrases}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior='automatic'
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.listContent,
          !hasPhrases && styles.listContentEmpty,
        ]}
        ListHeaderComponent={inputSection}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={
          hasPhrases ? (
            <Text type='xs' style={styles.footer}>
              {`${phrases.length} ${phrases.length === 1 ? 'phrase' : 'phrases'} · Tap a phrase in chat to insert it.`}
            </Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.color.surfacePressed.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonEnabled: {
    backgroundColor: theme.colorWhite,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 280,
    paddingHorizontal: 40,
  },
  emptySubtitle: {
    color: theme.color.textSecondary.dark,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.color.text.dark,
    marginTop: theme.space4,
  },
  footer: {
    color: theme.color.textSecondary.dark,
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    backgroundColor: theme.color.surface.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize16,
    height: 44,
    paddingHorizontal: theme.space16,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  inputSection: {
    gap: theme.space12,
    paddingBottom: theme.space16,
    paddingTop: theme.space12,
  },
  keyboardAvoid: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  phraseText: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: 20,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  rowEditing: {
    backgroundColor: theme.color.surface.dark,
  },
});
