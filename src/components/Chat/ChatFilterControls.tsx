import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';

interface ChatFilterControlsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onToggleShowOnlyMentions: () => void;
  showOnlyMentions: boolean;
}

export const ChatFilterControls = memo(
  ({
    hasActiveFilters,
    onClearFilters,
    onToggleShowOnlyMentions,
    showOnlyMentions,
  }: ChatFilterControlsProps) => {
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
              <SymbolView
                name='at'
                size={14}
                tintColor={theme.colorGreyHoverAlpha}
              />
              <Text style={styles.filterChipText}>Mentions</Text>
            </Button>

            <Button style={styles.clearChip} onPress={onClearFilters}>
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
