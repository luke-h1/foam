import { FlashList } from '@app/components/FlashList/FlashList';
import { Text } from '@app/components/ui/Text/Text';
import { Input } from '@app/components/ui/Input/Input';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FlashListRef, ListRenderItem } from '@app/components/FlashList/FlashList';

function SectionHeader({ count }: { count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text type='xxs' weight='semibold' style={styles.sectionTitle}>
        Blocked Terms
      </Text>
      {typeof count === 'number' ? (
        <Text type='xxs' color='gray.textLow' style={styles.sectionCount}>
          {count}
        </Text>
      ) : null}
    </View>
  );
}

function TermRow({
  term,
  index,
  count,
  onRemove,
}: {
  term: string;
  index: number;
  count: number;
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
          onPress: () => onRemove(term),
        },
      ],
    );
  }, [term, onRemove]);

  return (
    <View
      style={[
        styles.row,
        index === 0 && styles.rowFirst,
        index === count - 1 && styles.rowLast,
      ]}
    >
      <Text type='md' style={styles.termText} numberOfLines={1}>
        {term}
      </Text>
      <TouchableOpacity
        onPress={handleRemove}
        style={styles.removeButton}
        hitSlop={8}
        activeOpacity={0.7}
      >
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={theme.colorRed}
        />
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <ScrollView
      contentContainerStyle={styles.emptyContent}
      contentInsetAdjustmentBehavior='automatic'
    >
      <View style={styles.sectionHeaderEmpty}>
        <Text type='xxs' weight='semibold' style={styles.sectionTitle}>
          Blocked Terms
        </Text>
      </View>
      <View style={styles.emptyPanel}>
        <View style={styles.emptyIcon}>
          <SymbolView
            name='text.badge.xmark'
            size={28}
            tintColor={theme.colorGreyHoverAlpha}
          />
        </View>
        <Text type='lg' weight='bold' align='center'>
          No blocked terms
        </Text>
        <Text
          type='xs'
          color='gray.textLow'
          align='center'
          style={styles.emptyDescription}
        >
          Messages containing a blocked term will be hidden from chat.
        </Text>
      </View>
    </ScrollView>
  );
}

export function BlockedTermsScreen() {
  const insets = useSafeAreaInsets();
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
    ({ item, index }) => (
      <TermRow
        term={item}
        index={index}
        count={blockedTerms.length}
        onRemove={handleRemove}
      />
    ),
    [blockedTerms.length, handleRemove],
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.inputSection}>
        <Input
          autoCapitalize='none'
          autoCorrect={false}
          placeholder='Add a term to block…'
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleAdd}
          returnKeyType='done'
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[
            styles.addButton,
            !inputValue.trim() && styles.addButtonDisabled,
          ]}
          disabled={!inputValue.trim()}
          activeOpacity={0.75}
        >
          <SymbolView name='plus' size={16} tintColor='#fff' />
        </TouchableOpacity>
      </View>

      {blockedTerms.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            ref={listRef}
            data={blockedTerms}
            renderItem={renderItem}
            keyExtractor={item => item}
            estimatedItemSize={56}
            contentInsetAdjustmentBehavior='automatic'
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<SectionHeader count={blockedTerms.length} />}
            ListFooterComponent={
              <Text type='xxs' color='gray.textLow' style={styles.footer}>
                Messages containing these terms will be hidden from chat.
              </Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: theme.space24,
  },
  emptyDescription: {
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    height: 64,
    justifyContent: 'center',
    marginBottom: theme.space4,
    width: 64,
  },
  emptyPanel: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    marginHorizontal: theme.space16,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space36,
  },
  footer: {
    lineHeight: 18,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  input: {
    flex: 1,
  },
  inputSection: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space24,
  },
  removeButton: {
    flexShrink: 0,
    padding: 4,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    marginHorizontal: theme.space16,
    minHeight: 56,
    paddingVertical: theme.space12,
  },
  rowFirst: {
    borderTopLeftRadius: theme.borderRadius12,
    borderTopRightRadius: theme.borderRadius12,
  },
  rowLast: {
    borderBottomLeftRadius: theme.borderRadius12,
    borderBottomRightRadius: theme.borderRadius12,
    borderBottomWidth: 0,
  },
  sectionCount: {
    paddingHorizontal: theme.space16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space8,
  },
  sectionHeaderEmpty: {
    paddingBottom: theme.space8,
  },
  sectionTitle: {
    color: theme.colorGreyAlpha,
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
  termText: {
    color: theme.color.text.dark,
    flex: 1,
    minWidth: 0,
  },
});
