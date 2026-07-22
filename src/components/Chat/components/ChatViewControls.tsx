import { memo, useMemo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

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
    const { t } = useTranslation('chat');
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'light' ? 'light' : 'dark';
    const colorStyles = useMemo(
      () => ({
        chip: {
          backgroundColor: theme.color.backgroundAlt[scheme],
          borderColor: theme.color.border[scheme],
        },
        chipActive: {
          backgroundColor: theme.color.accentSurface[scheme],
          borderColor: theme.color.accentAlpha[scheme],
        },
      }),
      [scheme],
    );

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
                colorStyles.chip,
                showOnlyMentions && colorStyles.chipActive,
              ]}
              onPress={onToggleShowOnlyMentions}
            >
              <SymbolView
                name='at'
                size={14}
                tintColor={theme.color.textSecondary[scheme]}
              />
              <Text style={styles.filterChipText}>
                {t('controls.mentions')}
              </Text>
            </Button>

            <Button
              style={[styles.clearChip, colorStyles.chip]}
              onPress={onClearFilters}
            >
              <SymbolView
                name='xmark'
                size={14}
                tintColor={theme.color.textSecondary[scheme]}
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
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
