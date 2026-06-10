import { FlashList } from '@app/components/FlashList/FlashList';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { impact } from '@app/lib/haptics';
import { Color } from '@app/styles/pallete';
import {
  usePreference,
  useUpdatePreferences,
  type CustomHighlight,
} from '@app/store/preferenceStore';
import { normaliseHighlightPhrase } from '@app/utils/chat/customHighlights';
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import { PressableScale } from 'pressto';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type {
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';

const HIGHLIGHT_COLORS = [
  theme.colorPrimary,
  theme.colorBlue,
  theme.colorViolet,
  theme.colorAmber,
  theme.colorOrange,
  theme.colorRed,
] as const;

function HighlightRow({
  highlight,
  onRemove,
}: {
  highlight: CustomHighlight;
  onRemove: (id: string) => void;
}) {
  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove highlight',
      `Stop highlighting messages containing "${highlight.phrase}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(highlight.id),
        },
      ],
    );
  }, [highlight, onRemove]);

  return (
    <View style={styles.row}>
      <View style={[styles.colorDot, { backgroundColor: highlight.color }]} />
      <Text type='md' style={styles.phraseText} numberOfLines={1}>
        {highlight.phrase}
      </Text>
      <PressableScale onPress={handleRemove} hitSlop={8}>
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={Color.zinc[600]}
        />
      </PressableScale>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <SymbolView name='highlighter' size={48} tintColor={Color.zinc[600]} />
      <Text type='lg' weight='medium' style={styles.emptyTitle}>
        No highlights
      </Text>
      <Text type='sm' style={styles.emptySubtitle}>
        Messages containing a highlighted phrase get a colored tint in chat,
        plus a haptic buzz when mention feedback is on.
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
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize='none'
          autoCorrect={false}
          placeholder='Add a phrase to highlight…'
          placeholderTextColor={Color.zinc[500]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onAdd}
          returnKeyType='done'
          style={styles.input}
        />
        <PressableScale
          onPress={canAdd ? onAdd : undefined}
          style={[styles.addButton, canAdd ? styles.addButtonEnabled : null]}
        >
          <SymbolView
            name='plus'
            size={16}
            tintColor={canAdd ? Color.zinc[950] : Color.zinc[500]}
          />
        </PressableScale>
      </View>
      <View style={styles.swatchRow}>
        {HIGHLIGHT_COLORS.map(color => (
          <PressableScale
            key={color}
            onPress={() => onSelectColor(color)}
            hitSlop={6}
            style={[
              styles.swatch,
              { backgroundColor: color },
              color === selectedColor && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function ChatHighlightsScreen() {
  const customHighlights = usePreference('customHighlights');
  const updatePreferences = useUpdatePreferences();
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(
    HIGHLIGHT_COLORS[0],
  );
  const listRef = useRef<FlashListRef<CustomHighlight>>(null);

  useScrollToTop(listRef);

  const highlights = customHighlights ?? [];

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
    <KeyboardAvoidingView behavior='padding' style={styles.keyboardAvoid}>
      <FlashList
        ref={listRef}
        data={highlights}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior='automatic'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.listContent,
          !hasHighlights && styles.listContentEmpty,
        ]}
        ListHeaderComponent={inputSection}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={
          hasHighlights ? (
            <Text type='xs' style={styles.footer}>
              {highlights.length}{' '}
              {highlights.length === 1 ? 'phrase' : 'phrases'} · Matching
              messages are tinted in chat.
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
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonEnabled: {
    backgroundColor: Color.zinc[50],
  },
  colorDot: {
    borderRadius: 6,
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
    fontSize: 16,
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
    fontSize: 15,
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
  swatch: {
    borderColor: 'transparent',
    borderRadius: theme.borderRadius999,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  swatchSelected: {
    borderColor: theme.colorWhite,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
});
