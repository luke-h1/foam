import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Host,
  List,
  Section,
  Text as SwiftText,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
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
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { Color } from '@app/styles/palette';
import { theme } from '@app/styles/themes';
import { normaliseChatText } from '@app/utils/chat/normalise-chat-text';

function TermRow({
  term,
  onRemove,
}: {
  term: string;
  onRemove: (term: string) => void;
}) {
  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove blocked term',
      `Remove "${term}" from your blocked terms?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            impact('medium');
            onRemove(term);
          },
        },
      ],
    );
  }, [term, onRemove]);

  return (
    <View style={styles.row}>
      <Text type='headline' style={styles.termText} numberOfLines={1}>
        {term}
      </Text>
      <PressableScale onPress={handleRemove} hitSlop={11}>
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
        name='text.badge.xmark'
        size={48}
        tintColor={theme.color.textSecondary.dark}
      />
      <Text type='title3' weight='medium' style={styles.emptyTitle}>
        No blocked terms
      </Text>
      <Text type='body' style={styles.emptySubtitle}>
        Messages containing a blocked term will be hidden from chat.
      </Text>
    </View>
  );
}

type AddTermResult = 'added' | 'duplicate' | 'empty';

function useBlockedTerms() {
  const blockedTerms = usePreference('blockedTerms');
  const updatePreferences = useUpdatePreferences();

  const addTerm = (rawText: string): AddTermResult => {
    const normalised = normaliseChatText(rawText);
    if (!normalised) return 'empty';

    if (blockedTerms.includes(normalised)) {
      return 'duplicate';
    }

    updatePreferences({ blockedTerms: [...blockedTerms, normalised] });
    impact('light');
    return 'added';
  };

  return { addTerm, blockedTerms, updatePreferences };
}

interface InputSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
}

function InputSection({ value, onChangeText, onAdd }: InputSectionProps) {
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        placeholder='Add a term to block…'
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
  );
}

function NativeBlockedTermsList() {
  const { addTerm, blockedTerms, updatePreferences } = useBlockedTerms();
  const termText = useNativeState('');

  const handleNativeAdd = () => {
    if (addTerm(termText.value) !== 'empty') {
      termText.value = '';
    }
  };

  const handleDeleteByIndex = (indices: number[]) => {
    const first = blockedTerms[indices[0] ?? -1];

    if (!first) {
      return;
    }

    Alert.alert(
      'Remove blocked term',
      `Remove "${first} from your blocked terms"`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'remove',
          style: 'destructive',
          onPress: () => {
            impact('medium');
            const removals = new Set(indices);

            updatePreferences({
              blockedTerms: blockedTerms.filter(
                (_, index) => !removals.has(index),
              ),
            });
          },
        },
      ],
    );
  };

  const hasTerms = blockedTerms.length > 0;

  return (
    <Host style={styles.keyboardAvoid} colorScheme='dark'>
      <List modifiers={[listStyle('insetGrouped')]}>
        <Section
          footer={
            hasTerms ? undefined : (
              <SwiftText>
                Messages that contain a blocked word or phrase are hidden from
                chat.
              </SwiftText>
            )
          }
        >
          <TextField
            text={termText}
            placeholder='Add a term to block…'
            modifiers={[
              autocorrectionDisabled(true),
              textInputAutocapitalization('never'),
              submitLabel('done'),
              onSubmit(handleNativeAdd),
            ]}
          />
        </Section>
        {hasTerms ? (
          <Section
            footer={
              <SwiftText>
                {`${blockedTerms.length} ${blockedTerms.length === 1 ? 'term' : 'terms'} · Messages containing these will be hidden from chat.`}
              </SwiftText>
            }
          >
            <List.ForEach onDelete={handleDeleteByIndex}>
              {blockedTerms.map(term => (
                <SwiftText key={term}>{term}</SwiftText>
              ))}
            </List.ForEach>
          </Section>
        ) : null}
      </List>
    </Host>
  );
}

export function BlockedTermsScreen() {
  const { addTerm, blockedTerms, updatePreferences } = useBlockedTerms();
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<FlashListRef<string>>(null);

  useScrollToTop(listRef);

  const handleAdd = () => {
    if (addTerm(inputValue) !== 'empty') {
      setInputValue('');
    }
  };

  const handleRemove = useCallback(
    (term: string) => {
      updatePreferences({
        blockedTerms: blockedTerms.filter(t => t !== term),
      });
    },
    [blockedTerms, updatePreferences],
  );

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item }) => <TermRow term={item} onRemove={handleRemove} />,
    [handleRemove],
  );

  const inputSection = (
    <InputSection
      value={inputValue}
      onChangeText={setInputValue}
      onAdd={handleAdd}
    />
  );

  const hasTerms = blockedTerms.length > 0;

  if (Platform.OS === 'ios') {
    return <NativeBlockedTermsList />;
  }

  return (
    <KeyboardAvoidingView behavior='padding' style={styles.keyboardAvoid}>
      <FlashList
        ref={listRef}
        data={blockedTerms}
        renderItem={renderItem}
        keyExtractor={item => item}
        contentInsetAdjustmentBehavior='automatic'
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.listContent,
          !hasTerms && styles.listContentEmpty,
        ]}
        ListHeaderComponent={inputSection}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={
          hasTerms ? (
            <Text type='subhead' style={styles.footer}>
              {`${blockedTerms.length} ${blockedTerms.length === 1 ? 'term' : 'terms'} · Messages containing these will be hidden from chat.`}
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
    color: Color.zinc[400],
    marginTop: theme.space4,
  },
  footer: {
    color: theme.color.surface.dark,
    borderColor: theme.color.border.dark,
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    backgroundColor: Color.zinc[900],
    borderColor: Color.zinc[800],
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize16,
    height: 44,
    paddingHorizontal: theme.space16,
  },
  inputSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
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
  row: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  termText: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: 20,
    minWidth: 0,
  },
});
