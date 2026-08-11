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
  Text as NativeText,
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
} from '@app/components/FlashList/FlashList';
import { FlashList } from '@app/components/FlashList/FlashList';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { impact } from '@app/lib/haptics';
import {
  type SavedPhrase,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
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

function PhraseRow({
  phrase,
  isEditing,
  onEdit,
  onRemove,
}: {
  phrase: SavedPhrase;
  isEditing: boolean;
  onEdit: (phrase: SavedPhrase) => void;
  onRemove: (id: string) => void;
}) {
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
      <SymbolView name='text.bubble' size={48} tintColor={Color.zinc[600]} />
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
          placeholderTextColor={Color.zinc[500]}
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
            tintColor={canSave ? Color.zinc[950] : Color.zinc[500]}
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
              <NativeText>
                {`${phrases.length} ${phrases.length === 1 ? 'phrase' : 'phrases'} · Tap a phrase in chat to insert it.`}
              </NativeText>
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
                    <NativeText
                      modifiers={[foregroundStyle(theme.color.text.dark)]}
                    >
                      {phrase.text}
                    </NativeText>
                    <Spacer />
                  </HStack>
                </Button>
              ))}
            </List.ForEach>
          </Section>
        ) : null}
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
    backgroundColor: Color.zinc[800],
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonEnabled: {
    backgroundColor: Color.zinc[50],
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 280,
    paddingHorizontal: 40,
  },
  emptySubtitle: {
    color: Color.zinc[500],
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: Color.zinc[400],
    marginTop: theme.space4,
  },
  footer: {
    color: Color.zinc[500],
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    backgroundColor: Color.zinc[900],
    borderColor: Color.zinc[800],
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
    borderBottomColor: Color.zinc[800],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  rowEditing: {
    backgroundColor: Color.zinc[900],
  },
});
