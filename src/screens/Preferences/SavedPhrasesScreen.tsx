import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferences/selectors';
import { type SavedPhrase } from '@app/store/preferences/state';
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
      void impact('light');
      return 'edited';
    }

    updatePreferences({
      savedPhrases: [...phrases, { id: createPhraseId(text), text }],
    });
    void impact('light');
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
  const { t } = useTranslation(['preferences', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const handleRemove = useCallback(() => {
    Alert.alert(
      t('removePhrase'),
      t('removePhraseConfirm', { phrase: phrase.text }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => {
            void impact('medium');
            onRemove(phrase.id);
          },
        },
      ],
    );
  }, [phrase, onRemove, t]);

  return (
    <PressableScale
      onPress={() => onEdit(phrase)}
      style={[
        styles.row,
        { borderBottomColor: theme.color.border[scheme] },
        isEditing && {
          backgroundColor: theme.color.surfacePressed[scheme],
        },
      ]}
    >
      <Text
        type='md'
        style={[styles.phraseText, { color: theme.color.text[scheme] }]}
        numberOfLines={2}
      >
        {phrase.text}
      </Text>
      <PressableScale
        accessibilityLabel={t('removePhrase')}
        accessibilityRole='button'
        onPress={handleRemove}
        hitSlop={11}
      >
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={theme.color.textFaint[scheme]}
        />
      </PressableScale>
    </PressableScale>
  );
}

function EmptyState() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.emptyState}>
      <SymbolView
        name='text.bubble'
        size={56}
        tintColor={theme.color.textSecondary[scheme]}
      />
      <Text
        type='lg'
        weight='medium'
        style={[
          styles.emptyTitle,
          { color: theme.color.textSecondary[scheme] },
        ]}
      >
        {t('noSavedPhrases')}
      </Text>
      <Text
        type='sm'
        style={[styles.emptySubtitle, { color: theme.color.textFaint[scheme] }]}
      >
        {t('noSavedPhrasesDescription')}
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
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const canSave = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputRow}>
        <TextInput
          autoCorrect
          placeholder={t('addSavedPhrasePlaceholder')}
          placeholderTextColor={theme.color.textFaint[scheme]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSave}
          returnKeyType='done'
          style={[
            styles.input,
            {
              backgroundColor: theme.color.surface[scheme],
              borderColor: theme.color.border[scheme],
              color: theme.color.text[scheme],
            },
          ]}
        />
        <PressableScale
          onPress={canSave ? onSave : undefined}
          style={[
            styles.addButton,
            {
              backgroundColor: canSave
                ? theme.color.text[scheme]
                : theme.color.surfacePressed[scheme],
            },
          ]}
        >
          <SymbolView
            name={isEditing ? 'checkmark' : 'plus'}
            size={16}
            tintColor={
              canSave
                ? theme.color.background[scheme]
                : theme.color.textFaint[scheme]
            }
          />
        </PressableScale>
      </View>
    </View>
  );
}

function NativeSavedPhrasesList() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
    <Host
      style={[
        styles.keyboardAvoid,
        { backgroundColor: theme.color.background[scheme] },
      ]}
      colorScheme={scheme}
    >
      <List modifiers={[listStyle('insetGrouped')]}>
        <Section>
          <TextField
            text={phraseText}
            placeholder={t('addSavedPhrasePlaceholder')}
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
                {t('savedPhrasesFooter', { count: phrases.length })}
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
                      modifiers={[foregroundStyle(theme.color.text[scheme])]}
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
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
    <KeyboardAvoidingView
      behavior='padding'
      style={[
        styles.keyboardAvoid,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
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
            <Text
              type='xs'
              style={[styles.footer, { color: theme.color.textFaint[scheme] }]}
            >
              {t('savedPhrasesFooter', { count: phrases.length })}
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 280,
    paddingHorizontal: 40,
  },
  emptySubtitle: {
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: theme.space4,
  },
  footer: {
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
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
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: 20,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
});
