import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { SearchBox } from '@app/components/SearchBox/SearchBox';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface ChatViewControlsProps {
  hasActiveFilters: boolean;
  isPaused: boolean;
  onChangeSearch: (value: string) => void;
  onClearFilters: () => void;
  onTogglePause: () => void;
  onToggleSearch: () => void;
  onToggleShowOnlyMentions: () => void;
  searchQuery: string;
  showOnlyMentions: boolean;
  showSearch: boolean;
}

export const ChatViewControls = memo(
  ({
    hasActiveFilters,
    isPaused,
    onChangeSearch,
    onClearFilters,
    onTogglePause,
    onToggleSearch,
    onToggleShowOnlyMentions,
    searchQuery,
    showOnlyMentions,
    showSearch,
  }: ChatViewControlsProps) => {
    return (
      <View style={styles.wrapper}>
        <View style={styles.buttonRow}>
          <Button style={styles.controlButton} onPress={onToggleSearch}>
            <Icon icon="search" size={16} />
            <Text style={styles.controlText}>
              {showSearch ? 'Hide Search' : 'Search'}
            </Text>
          </Button>

          <Button style={styles.controlButton} onPress={onTogglePause}>
            <Icon icon={isPaused ? 'play' : 'pause'} size={16} />
            <Text style={styles.controlText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </Button>
        </View>

        {(showSearch || hasActiveFilters) && (
          <View style={styles.searchTray}>
            {showSearch && (
              <SearchBox
                placeholder="filter"
                onChange={onChangeSearch}
                value={searchQuery}
                rightOnPress={() => onChangeSearch('')}
              />
            )}

            <View style={styles.filterRow}>
              <Button
                style={[
                  styles.filterChip,
                  showOnlyMentions && styles.filterChipActive,
                ]}
                onPress={onToggleShowOnlyMentions}
              >
                <Icon icon="at-sign" size={14} />
                <Text style={styles.filterChipText}>Mentions</Text>
              </Button>

              {hasActiveFilters && (
                <Button style={styles.clearChip} onPress={onClearFilters}>
                  <Icon icon="x" size={14} />
                  <Text style={styles.filterChipText}>Clear</Text>
                </Button>
              )}
            </View>
          </View>
        )}
      </View>
    );
  },
);

ChatViewControls.displayName = 'ChatViewControls';

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  clearChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  controlText: {
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: 'rgba(145, 71, 255, 0.18)',
  },
  filterChipText: {
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  searchTray: {
    marginTop: theme.spacing.sm,
  },
  wrapper: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
});
