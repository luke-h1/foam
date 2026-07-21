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
  Host,
  List,
  Section,
  Text as NativeText,
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
import { theme } from '@app/styles/themes';

function TermRow({
  term,
  onRemove,
}: {
  term: string;
  onRemove: (term: string) => void;
}) {
  const { t } = useTranslation(['preferences', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const handleRemove = useCallback(() => {
    Alert.alert(
      t('removeBlockedTerm'),
      t('removeBlockedTermConfirm', { term }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => {
            void impact('medium');
            onRemove(term);
          },
        },
      ],
    );
  }, [term, onRemove, t]);

  return (
    <View
      style={[styles.row, { borderBottomColor: theme.color.border[scheme] }]}
    >
      <Text
        type='md'
        style={[styles.termText, { color: theme.color.text[scheme] }]}
        numberOfLines={1}
      >
        {term}
      </Text>
      <PressableScale onPress={handleRemove} hitSlop={11}>
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
        name='text.badge.xmark'
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
        {t('noBlockedTerms')}
      </Text>
      <Text
        type='sm'
        style={[styles.emptySubtitle, { color: theme.color.textFaint[scheme] }]}
      >
        {t('noBlockedTermsDescription')}
      </Text>
    </View>
  );
}

type AddTermResult = 'added' | 'duplicate' | 'empty';

function useBlockedTerms() {
  const blockedTerms = usePreference('blockedTerms');
  const updatePreferences = useUpdatePreferences();

  const addTerm = (rawText: string): AddTermResult => {
    const normalised = rawText.trim().toLowerCase();
    if (!normalised) return 'empty';

    if (blockedTerms.includes(normalised)) {
      return 'duplicate';
    }

    updatePreferences({ blockedTerms: [...blockedTerms, normalised] });
    void impact('light');
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
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        placeholder={t('addTermPlaceholder')}
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
  );
}

function NativeBlockedTermsList() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const { addTerm, blockedTerms, updatePreferences } = useBlockedTerms();
  const termText = useNativeState('');

  const handleNativeAdd = () => {
    if (addTerm(termText.value) !== 'empty') {
      termText.value = '';
    }
  };

  const handleDeleteByIndex = (indices: number[]) => {
    const removals = new Set(indices);
    updatePreferences({
      blockedTerms: blockedTerms.filter((_, index) => !removals.has(index)),
    });
  };

  const hasTerms = blockedTerms.length > 0;

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
            text={termText}
            placeholder={t('addTermPlaceholder')}
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
              <NativeText>
                {t('termsFooter', { count: blockedTerms.length })}
              </NativeText>
            }
          >
            <List.ForEach onDelete={handleDeleteByIndex}>
              {blockedTerms.map(term => (
                <NativeText key={term}>{term}</NativeText>
              ))}
            </List.ForEach>
          </Section>
        ) : null}
      </List>
    </Host>
  );
}

export function BlockedTermsScreen() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
    <KeyboardAvoidingView
      behavior='padding'
      style={[
        styles.keyboardAvoid,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
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
            <Text
              type='xs'
              style={[styles.footer, { color: theme.color.textFaint[scheme] }]}
            >
              {t('termsFooter', { count: blockedTerms.length })}
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
  inputSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
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
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  termText: {
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: 20,
    minWidth: 0,
  },
});
