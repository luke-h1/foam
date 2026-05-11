import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface ChatViewControlsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onToggleShowOnlyMentions: () => void;
  showOnlyMentions: boolean;
}

export const ChatViewControls = memo(
  ({
    hasActiveFilters,
    onClearFilters,
    onToggleShowOnlyMentions,
    showOnlyMentions,
  }: ChatViewControlsProps) => {
    if (!hasActiveFilters) {
      return null;
    }

    return (
      <View style={styles.wrapper}>
        <View style={styles.searchTray}>
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

            <Button style={styles.clearChip} onPress={onClearFilters}>
              <Icon icon="x" size={14} />
              <Text style={styles.filterChipText}>Clear</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  },
);

ChatViewControls.displayName = 'ChatViewControls';

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
  searchTray: {
    marginTop: theme.space12,
  },
  wrapper: {
    paddingHorizontal: theme.space12,
  },
});
