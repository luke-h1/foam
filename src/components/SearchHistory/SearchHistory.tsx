import { Entypo } from '@expo/vector-icons';
import { ListRenderItem } from '@shopify/flash-list';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { FlashList } from '../FlashList';
import { Typography } from '../Typography';

interface Props {
  results: string[];
  onClearItem: (id: string) => void;
  onSelectItem: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistory({
  results,
  onClearAll,
  onClearItem,
  onSelectItem,
}: Props) {
  const { theme } = useUnistyles();

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item }) => (
      <View style={styles.itemContainer}>
        <Button style={styles.item} onPress={() => onSelectItem(item)}>
          <Typography>{item}</Typography>
        </Button>
        <Button onPress={() => onClearItem(item)}>
          <Entypo
            name="cross"
            size={24}
            color={theme.colors.crimson.accentAlpha}
          />
        </Button>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {results.length > 0 && (
          <>
            <Typography>Search History</Typography>
            <Button onPress={onClearAll}>
              <Typography style={styles.clearAll}>Clear All</Typography>
            </Button>
          </>
        )}
      </View>
      <FlashList<string>
        data={results}
        style={styles.item}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  clearAll: {
    color: theme.colors.gray.accentAlpha,
  },
  item: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    color: theme.colors.gray.accent,
  },
}));
