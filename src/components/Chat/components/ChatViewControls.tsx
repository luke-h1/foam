import { memo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { theme } from '@app/styles/themes';

interface ChatViewControlsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCloseSearch: () => void;
  searchActive: boolean;
  onSearchQueryChange: (query: string) => void;
  onToggleShowOnlyMentions: () => void;
  searchQuery: string;
  showOnlyMentions: boolean;
}

export const ChatViewControls = memo(
  ({
    hasActiveFilters,
    onClearFilters,
    onCloseSearch,
    searchActive,
    onSearchQueryChange,
    onToggleShowOnlyMentions,
    searchQuery,
    showOnlyMentions,
  }: ChatViewControlsProps) => {
    const { t } = useTranslation('chat');
    /**
     * The query lives on a per-channel observable the root Chat component
     * subscribes to, so writing every keystroke straight through would re-render
     * the tree and re-filter the whole message window per character. The field
     * stays local and the store catches up.
     *
     * No resync effect: every path that clears the query (Clear, close, leaving
     * the channel) also drops `hasActiveFilters`, which unmounts this whole
     * component, so the local value can never go stale against the store.
     */
    // eslint-disable-next-line react-doctor/no-derived-useState -- every path that changes the stored query also unmounts this component
    const [draftQuery, setDraftQuery] = useState(searchQuery);
    const [pushQuery] = useDebouncedCallback((value: string) => {
      onSearchQueryChange(value);
    }, 150);

    const handleQueryChange = (value: string) => {
      setDraftQuery(value);
      void pushQuery(value);
    };

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
              onChangeText={handleQueryChange}
              placeholder={t('controls.searchMessages')}
              placeholderTextColor={theme.color.textSecondary.dark}
              returnKeyType='search'
              selectionColor={theme.colorTextSelection}
              selectionHandleColor={theme.colorPrimary}
              style={styles.searchInput}
              underlineColorAndroid='transparent'
              value={draftQuery}
            />
            {searchActive ? (
              <Button
                accessibilityLabel={t('controls.closeSearch')}
                accessibilityRole='button'
                onPress={onCloseSearch}
              >
                <SymbolView
                  name='xmark'
                  size={14}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </Button>
            ) : null}
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
