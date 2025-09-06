import { createHitslop } from '@app/utils';
import { View } from 'react-native';
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

/**
 * TODO: add swipeable support
 */
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
        <Button
          style={styles.button}
          hitSlop={createHitslop(16)}
          key={query}
          label={query}
          onPress={() => {
            onSelectItem(query);
          }}
        >
          <Icon icon="zoom-in" color={theme.colors.gray.text} />
          <Typography style={styles.query}>{query}</Typography>
          <Button
            hitSlop={createHitslop(16)}
            onPress={() => onClearItem(query)}
          >
            <Icon color={theme.colors.red.accent} icon="x" />
          </Button>
        </Button>
      ))}

      <Button style={styles.clearAllButton} onPress={() => onClearAll()}>
        <Icon icon="x" color={theme.colors.red.accent}>
          <Typography fontWeight="semiBold">Clear all</Typography>
        </Icon>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  wrapper: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  query: {
    flex: 1,
  },
  clearAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
}));
