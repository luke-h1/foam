import { createHitslop } from '@app/utils';
// eslint-disable-next-line no-restricted-imports
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Typography } from '../Typography';

interface SearchHistoryV2Props {
  history: string[];
  onClearItem: (id: string) => void;
  onSelectItem: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistoryV2({
  history,
  onClearAll,
  onClearItem,
  onSelectItem,
}: SearchHistoryV2Props) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.wrapper}>
      <Typography size="md" fontWeight="semiBold">
        Search History
      </Typography>

      {history.map(query => (
        <View key={query} style={styles.historyItem}>
          <Pressable
            style={styles.historyButton}
            hitSlop={createHitslop(16)}
            onPress={() => onSelectItem(query)}
          >
            <Icon icon="search" color={theme.colors.gray.text} size={18} />
            <Typography style={styles.query}>{query}</Typography>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            hitSlop={createHitslop(16)}
            onPress={() => onClearItem(query)}
          >
            <Icon icon="x" size={18} />
          </Pressable>
        </View>
      ))}

      {history.length > 0 && (
        <Button style={styles.clearAllButton} onPress={onClearAll}>
          {/* <Icon icon="x" size={18} /> */}
          <Typography color="red.accent">Clear all</Typography>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  wrapper: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: theme.colors.gray.accent,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  query: {
    flex: 1,
    color: theme.colors.gray.text,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.red.accentAlpha,
  },
  clearAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
}));
