import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

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
import { type CustomHighlight } from '@app/store/preferences/state';
import { type ColorScheme, theme } from '@app/styles/themes';
import { normaliseHighlightPhrase } from '@app/utils/chat/customHighlights/normaliseHighlightPhrase';

const getHighlightColors = (scheme: ColorScheme) =>
  [
    theme.color.accent[scheme],
    theme.color.blue[scheme],
    theme.color.violet[scheme],
    theme.color.amber[scheme],
    theme.color.orange[scheme],
    theme.color.danger[scheme],
  ] as const;

const EMPTY_HIGHLIGHTS: CustomHighlight[] = [];

function HighlightRow({
  highlight,
  onRemove,
}: {
  highlight: CustomHighlight;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation(['preferences', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const handleRemove = useCallback(() => {
    Alert.alert(
      t('removeHighlight'),
      t('removeHighlightConfirm', { phrase: highlight.phrase }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => {
            void impact('medium');
            onRemove(highlight.id);
          },
        },
      ],
    );
  }, [highlight, onRemove, t]);

  return (
    <View
      style={[styles.row, { borderBottomColor: theme.color.border[scheme] }]}
    >
      <View style={[styles.colorDot, { backgroundColor: highlight.color }]} />
      <Text
        type='md'
        style={[styles.phraseText, { color: theme.color.text[scheme] }]}
        numberOfLines={1}
      >
        {highlight.phrase}
      </Text>
      <PressableScale onPress={handleRemove} hitSlop={8}>
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={theme.color.textFaint[scheme]}
        />
      </PressableScale>
    </View>
  );
}

function EmptyState() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.emptyState}>
      <SymbolView
        name='highlighter'
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
        {t('noHighlights')}
      </Text>
      <Text
        type='sm'
        style={[styles.emptySubtitle, { color: theme.color.textFaint[scheme] }]}
      >
        {t('noHighlightsDescription')}
      </Text>
    </View>
  );
}

interface InputSectionProps {
  value: string;
  selectedColor: string;
  onChangeText: (text: string) => void;
  onSelectColor: (color: string) => void;
  onAdd: () => void;
}

function InputSection({
  value,
  selectedColor,
  onChangeText,
  onSelectColor,
  onAdd,
}: InputSectionProps) {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize='none'
          autoCorrect={false}
          placeholder={t('addPhrasePlaceholder')}
          placeholderTextColor={theme.color.textFaint[scheme]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onAdd}
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
          onPress={canAdd ? onAdd : undefined}
          style={[
            styles.addButton,
            {
              backgroundColor: canAdd
                ? theme.color.text[scheme]
                : theme.color.surfacePressed[scheme],
            },
          ]}
        >
          <SymbolView
            name='plus'
            size={16}
            tintColor={
              canAdd
                ? theme.color.background[scheme]
                : theme.color.textFaint[scheme]
            }
          />
        </PressableScale>
      </View>
      <View style={styles.swatchRow}>
        {getHighlightColors(scheme).map(color => (
          <PressableScale
            key={color}
            onPress={() => onSelectColor(color)}
            hitSlop={6}
            style={[
              styles.swatch,
              { backgroundColor: color },
              color === selectedColor && {
                borderColor: theme.color.text[scheme],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function ChatHighlightsScreen() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const customHighlights = usePreference('customHighlights');
  const updatePreferences = useUpdatePreferences();
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(
    () => getHighlightColors(scheme)[0],
  );
  const listRef = useRef<FlashListRef<CustomHighlight>>(null);

  useScrollToTop(listRef);

  const highlights = customHighlights ?? EMPTY_HIGHLIGHTS;

  const handleAdd = useCallback(() => {
    const phrase = normaliseHighlightPhrase(inputValue);
    if (!phrase) return;
    if (highlights.some(highlight => highlight.phrase === phrase)) {
      setInputValue('');
      return;
    }
    updatePreferences({
      customHighlights: [
        ...highlights,
        { id: `${Date.now()}_${phrase}`, phrase, color: selectedColor },
      ],
    });
    setInputValue('');
    void impact('light');
  }, [inputValue, highlights, selectedColor, updatePreferences]);

  const handleRemove = useCallback(
    (id: string) => {
      updatePreferences({
        customHighlights: highlights.filter(highlight => highlight.id !== id),
      });
    },
    [highlights, updatePreferences],
  );

  const renderItem: ListRenderItem<CustomHighlight> = useCallback(
    ({ item }) => <HighlightRow highlight={item} onRemove={handleRemove} />,
    [handleRemove],
  );

  const inputSection = (
    <InputSection
      value={inputValue}
      selectedColor={selectedColor}
      onChangeText={setInputValue}
      onSelectColor={setSelectedColor}
      onAdd={handleAdd}
    />
  );

  const hasHighlights = highlights.length > 0;

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
        data={highlights}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior='automatic'
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.listContent,
          !hasHighlights && styles.listContentEmpty,
        ]}
        ListHeaderComponent={inputSection}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={
          hasHighlights ? (
            <Text
              type='xs'
              style={[styles.footer, { color: theme.color.textFaint[scheme] }]}
            >
              {t('phrasesFooter', { count: highlights.length })}
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
  colorDot: {
    borderRadius: theme.borderRadius6,
    height: 12,
    width: 12,
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
  swatch: {
    borderColor: 'transparent',
    borderRadius: theme.borderRadius999,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
});
