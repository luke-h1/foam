import { FlashList } from '@app/components/FlashList/FlashList';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { impact } from '@app/lib/haptics';
import { Color } from '@app/styles/pallete';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { PressableScale } from 'pressto';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type {
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { useTranslation } from 'react-i18next';

function TermRow({
  term,
  onRemove,
}: {
  term: string;
  onRemove: (term: string) => void;
}) {
  const { t } = useTranslation(['preferences', 'common']);
  const handleRemove = useCallback(() => {
    Alert.alert(
      t('removeBlockedTerm'),
      t('removeBlockedTermConfirm', { term }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => onRemove(term),
        },
      ],
    );
  }, [term, onRemove, t]);

  return (
    <View style={styles.row}>
      <Text type='md' style={styles.termText} numberOfLines={1}>
        {term}
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
  const { t } = useTranslation('preferences');

  return (
    <View style={styles.emptyState}>
      <SymbolView
        name='text.badge.xmark'
        size={48}
        tintColor={Color.zinc[600]}
      />
      <Text type='lg' weight='medium' style={styles.emptyTitle}>
        {t('noBlockedTerms')}
      </Text>
      <Text type='sm' style={styles.emptySubtitle}>
        {t('noBlockedTermsDescription')}
      </Text>
    </View>
  );
}

interface InputSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
}

function InputSection({ value, onChangeText, onAdd }: InputSectionProps) {
  const { t } = useTranslation('preferences');
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        placeholder={t('addTermPlaceholder')}
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
  );
}

export function BlockedTermsScreen() {
  const { t } = useTranslation('preferences');
  const blockedTerms = usePreference('blockedTerms');
  const updatePreferences = useUpdatePreferences();
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<FlashListRef<string>>(null);

  useScrollToTop(listRef);

  const handleAdd = useCallback(() => {
    const normalised = inputValue.trim().toLowerCase();
    if (!normalised) return;
    if (blockedTerms.includes(normalised)) {
      setInputValue('');
      return;
    }
    updatePreferences({ blockedTerms: [...blockedTerms, normalised] });
    setInputValue('');
    void impact('light');
  }, [inputValue, blockedTerms, updatePreferences]);

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
            <Text type='xs' style={styles.footer}>
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
    borderBottomColor: Color.zinc[800],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  termText: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
  },
});
