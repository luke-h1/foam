import { Entypo } from '@expo/vector-icons';
import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
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
        <Typography>Search History</Typography>
        {results.length > 0 && (
          <TouchableOpacity onPress={onClearAll}>
            <Typography style={styles.clearAll}>Clear All</Typography>
          </TouchableOpacity>
        )}
      </View>
      <FlatList<string>
        data={results}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelectItem(item)}
            >
              <Typography>{item}</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onClearItem(item)}>
              <Entypo name="cross" size={24} color={theme.colors.underline} />
            </TouchableOpacity>
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
