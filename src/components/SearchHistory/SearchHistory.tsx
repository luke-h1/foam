import { Entypo } from '@expo/vector-icons';
import React from 'react';
import { View, FlatList } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
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
  const { styles, theme } = useStyles(stylesheet);
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
      <FlatList<string>
        data={results}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Button style={styles.item} onPress={() => onSelectItem(item)}>
              <Typography size="sm">{item}</Typography>
            </Button>
            <Button onPress={() => onClearItem(item)}>
              <Entypo name="cross" size={24} color={theme.colors.underline} />
            </Button>
          </View>
        )}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
    color: theme.colors.surfaceHighContrast,
  },
  item: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
  },
}));
