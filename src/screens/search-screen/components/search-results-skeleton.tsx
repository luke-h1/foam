import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { theme } from '@app/styles/themes';

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

export function SearchResultsSkeleton() {
  return (
    <View testID='search-results-skeleton'>
      {SKELETON_ROWS.map(row => (
        <View key={row} style={styles.row}>
          <Skeleton style={styles.thumbnail} />
          <View style={styles.copy}>
            <Skeleton style={styles.name} />
            <Skeleton style={styles.subtitle} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: theme.space8,
  },
  name: {
    borderRadius: theme.radius.sm,
    height: 14,
    width: '55%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  subtitle: {
    borderRadius: theme.radius.sm,
    height: 11,
    width: '35%',
  },
  thumbnail: {
    borderRadius: theme.radius.full,
    height: 48,
    width: 48,
  },
});
