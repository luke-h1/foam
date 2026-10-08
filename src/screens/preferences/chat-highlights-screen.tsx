import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Host,
  HStack,
  Image as NativeImage,
  List,
  Section,
  Spacer,
  Text as SwiftText,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  foregroundStyle,
  listStyle,
  onSubmit,
  submitLabel,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';
import { PressableScale } from 'pressto';
import { toast } from 'sonner-native';

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
  type CustomHighlight,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import { normaliseChatText } from '@app/utils/chat/normalise-chat-text';

const HIGHLIGHT_COLORS = [
  theme.colorPrimary,
  theme.colorBlue,
  theme.colorViolet,
  theme.colorAmber,
  theme.colorOrange,
  theme.colorRed,
] as const;

const EMPTY_HIGHLIGHTS: CustomHighlight[] = [];

type AddHighlightResult = 'added' | 'duplicate' | 'empty';

function useCustomHighlights() {
  const customHighlights = usePreference('customHighlights');
  const updatePreferences = useUpdatePreferences();

  const highlights = customHighlights ?? EMPTY_HIGHLIGHTS;

  const addHighlight = (rawText: string, color: string): AddHighlightResult => {
    const phrase = normaliseChatText(rawText);
    if (!phrase) return 'empty';

    if (highlights.some(highlight => highlight.phrase === phrase)) {
      return 'duplicate';
    }

    updatePreferences({
      customHighlights: [
        ...highlights,
        { id: `${Date.now()}_${phrase}`, phrase, color },
      ],
    });

    impact('light');
    return 'added';
  };

  return { addHighlight, highlights, updatePreferences };
}

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
          onPress: () => {
            impact('medium');
            onRemove(highlight.id);
          },
        },
      ],
    );
  }, [highlight, onRemove]);

  return (
    <View style={styles.row}>
      <View style={[styles.colorDot, { backgroundColor: highlight.color }]} />
      <Text type='headline' style={styles.phraseText} numberOfLines={1}>
        {highlight.phrase}
      </Text>
      <PressableScale onPress={handleRemove} hitSlop={8}>
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={theme.color.textSecondary.dark}
        />
      </PressableScale>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <SymbolView
        name='highlighter'
        size={48}
        tintColor={theme.color.textSecondary.dark}
      />
      <Text type='title3' weight='medium' style={styles.emptyTitle}>
        No highlights
      </Text>
      <Text type='body' style={styles.emptySubtitle}>
        Messages with a highlighted phrase get a color tint. They also buzz when
        mention feedback is on.
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
          placeholderTextColor={theme.color.textFaint.dark}
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
            tintColor={canAdd ? theme.colorBlack : theme.color.textFaint.dark}
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

function NativeChatHighlightsList() {
  const { addHighlight, highlights, updatePreferences } = useCustomHighlights();

  const [selectedColor, setSelectedColor] = useState<string>(
    HIGHLIGHT_COLORS[0],
  );

  const phraseText = useNativeState('');

  const handleNativeAdd = () => {
    const result = addHighlight(phraseText.value, selectedColor);

    if (result === 'duplicate') {
      toast.error('That phrase is already highlighted');
    }

    if (result !== 'empty') {
      phraseText.value = '';
    }
  };

  const handleDeleteByIndex = (indices: number[]) => {
    const targets = indices
      .map(index => highlights[index])
      .filter(highlight => highlight !== undefined);

    const first = targets[0];

    if (!first) {
      return;
    }

    Alert.alert(
      'Remove highlight',
      `Stop highlighting messages containing "${first.phrase}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            impact('medium');
            const removals = new Set(targets.map(target => target.id));

            updatePreferences({
              customHighlights: highlights.filter(
                highlight => !removals.has(highlight.id),
              ),
            });
          },
        },
      ],
    );
  };

  const hasHighlights = highlights.length > 0;

  return (
    <Host style={styles.keyboardAvoid} colorScheme='dark'>
      <List modifiers={[listStyle('insetGrouped')]}>
        <Section>
          <TextField
            text={phraseText}
            placeholder='Add a phrase to highlight…'
            modifiers={[
              autocorrectionDisabled(true),
              textInputAutocapitalization('never'),
              submitLabel('done'),
              onSubmit(handleNativeAdd),
            ]}
          />
          <HStack spacing={theme.space12}>
            {HIGHLIGHT_COLORS.map(color => (
              <NativeImage
                key={color}
                systemName={
                  color === selectedColor
                    ? 'checkmark.circle.fill'
                    : 'circle.fill'
                }
                color={color}
                size={28}
                onPress={() => setSelectedColor(color)}
              />
            ))}
            <Spacer />
          </HStack>
        </Section>
        {hasHighlights ? (
          <Section
            footer={
              <SwiftText>
                {`${highlights.length} ${highlights.length === 1 ? 'phrase' : 'phrases'} · Matching messages are tinted in chat.`}
              </SwiftText>
            }
          >
            <List.ForEach onDelete={handleDeleteByIndex}>
              {highlights.map(highlight => (
                <HStack key={highlight.id} spacing={theme.space12}>
                  <NativeImage
                    systemName='circle.fill'
                    color={highlight.color}
                    size={12}
                  />
                  <SwiftText
                    modifiers={[foregroundStyle(theme.color.text.dark)]}
                  >
                    {highlight.phrase}
                  </SwiftText>
                  <Spacer />
                </HStack>
              ))}
            </List.ForEach>
          </Section>
        ) : (
          <Section title='No highlights'>
            <SwiftText
              modifiers={[foregroundStyle(theme.color.textSecondary.dark)]}
            >
              Add a phrase above and pick a color. Matching messages get a tint
              in chat.
            </SwiftText>
          </Section>
        )}
      </List>
    </Host>
  );
}

export function ChatHighlightsScreen() {
  const { addHighlight, highlights, updatePreferences } = useCustomHighlights();
  const [inputValue, setInputValue] = useState('');

  const [selectedColor, setSelectedColor] = useState<string>(
    HIGHLIGHT_COLORS[0],
  );

  const listRef = useRef<FlashListRef<CustomHighlight>>(null);

  useScrollToTop(listRef);

  const handleAdd = () => {
    const result = addHighlight(inputValue, selectedColor);

    if (result === 'duplicate') {
      toast.error('That phrase is already highlighted');
    }

    if (result !== 'empty') {
      setInputValue('');
    }
  };

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

  if (Platform.OS === 'ios') {
    return <NativeChatHighlightsList />;
  }

  return (
    <KeyboardAvoidingView behavior='padding' style={styles.keyboardAvoid}>
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
            <Text type='subhead' style={styles.footer}>
              {`${highlights.length} ${highlights.length === 1 ? 'phrase' : 'phrases'} · Matching messages are tinted in chat.`}
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
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonEnabled: {
    backgroundColor: theme.colorWhite,
  },
  colorDot: {
    borderRadius: theme.radius.sm,
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
    color: theme.color.textSecondary.dark,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.color.text.dark,
    marginTop: theme.space4,
  },
  footer: {
    color: theme.color.surface.dark,
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    backgroundColor: theme.color.surface.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
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
  swatch: {
    borderColor: 'transparent',
    borderRadius: theme.radius.full,
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
