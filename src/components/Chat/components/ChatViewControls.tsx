import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { ChatSearchField } from './ChatSearchField';

interface ChatViewControlsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCloseSearch: () => void;
  searchActive: boolean;
  onSearchQueryChange: (query: string) => void;
  onToggleShowOnlyMentions: () => void;
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
    showOnlyMentions,
  }: ChatViewControlsProps) => {
    if (!hasActiveFilters) {
      return null;
    }

    return (
      <View style={styles.wrapper}>
        <View style={styles.searchTray}>
          {searchActive ? (
            <ChatSearchField
              onClose={onCloseSearch}
              onQueryChange={onSearchQueryChange}
            />
          ) : null}

          <View style={styles.filterRow}>
            <Button
              accessibilityLabel='Mentions'
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
              <Text style={styles.filterChipText}>Mentions</Text>
            </Button>

            <Button
              accessibilityLabel='Clear'
              accessibilityRole='button'
              style={styles.filterChip}
              onPress={onClearFilters}
            >
              <SymbolView
                name='xmark'
                size={14}
                tintColor={theme.colorGreyHoverAlpha}
              />
              <Text style={styles.filterChipText}>Clear</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
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
  searchTray: {
    marginTop: theme.space12,
  },
  wrapper: {
    paddingHorizontal: theme.space12,
  },
});
