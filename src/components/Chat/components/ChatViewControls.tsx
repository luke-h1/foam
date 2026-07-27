import { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

interface ChatViewControlsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSearchQueryChange: (query: string) => void;
  onToggleShowOnlyMentions: () => void;
  searchQuery: string;
  showOnlyMentions: boolean;
}

export const ChatViewControls = memo(
  ({
    hasActiveFilters,
    onClearFilters,
    onSearchQueryChange,
    onToggleShowOnlyMentions,
    searchQuery,
    showOnlyMentions,
  }: ChatViewControlsProps) => {
    const { t } = useTranslation('chat');

    if (!hasActiveFilters) {
      return null;
    }

    return (
      <View style={styles.wrapper}>
        <View style={styles.searchTray}>
          <View style={styles.searchField}>
            <SymbolView
              name='magnifyingglass'
              size={14}
              tintColor={theme.colorGreyHoverAlpha}
            />
            <TextInput
              accessibilityLabel={t('controls.searchMessages')}
              autoCapitalize='none'
              autoCorrect={false}
              cursorColor={theme.color.text.dark}
              onChangeText={onSearchQueryChange}
              placeholder={t('controls.searchMessages')}
              placeholderTextColor={theme.color.textSecondary.dark}
              returnKeyType='search'
              selectionColor={theme.colorTextSelection}
              selectionHandleColor={theme.colorPrimary}
              style={styles.searchInput}
              underlineColorAndroid='transparent'
              value={searchQuery}
            />
          </View>

          <View style={styles.filterRow}>
            <Button
              accessibilityLabel={t('controls.mentions')}
              accessibilityRole='button'
              accessibilityState={{ selected: showOnlyMentions }}
              style={[
                styles.filterChip,
                showOnlyMentions && styles.filterChipActive,
              ]}
              onPress={onToggleShowOnlyMentions}
            >
              <SymbolView
                name='at'
                size={14}
                tintColor={theme.colorGreyHoverAlpha}
              />
              <Text style={styles.filterChipText}>
                {t('controls.mentions')}
              </Text>
            </Button>

            <Button
              accessibilityLabel={t('controls.clear')}
              accessibilityRole='button'
              style={styles.clearChip}
              onPress={onClearFilters}
            >
              <SymbolView
                name='xmark'
                size={14}
                tintColor={theme.colorGreyHoverAlpha}
              />
              <Text style={styles.filterChipText}>{t('controls.clear')}</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  clearChip: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  filterChipActive: {
    backgroundColor: theme.colorAccentSurface,
    borderColor: theme.colorAccentAlpha,
  },
  filterChipText: {
    fontSize: theme.fontSize11,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space12,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space12,
  },
  searchInput: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize14,
    height: 36,
    paddingVertical: 0,
  },
  searchTray: {
    marginTop: theme.space12,
  },
  wrapper: {
    paddingHorizontal: theme.space12,
  },
});
