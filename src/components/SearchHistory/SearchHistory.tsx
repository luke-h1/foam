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
  const { styles } = useStyles(stylesheet);
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
              <Entypo name="cross" size={24} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    margin: theme.spacing.md - 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  clearAll: {
    color: theme.colors.cherry,
  },
  item: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 0.25,
    borderBottomColor: theme.colors.borderFaint,
  },
}));
