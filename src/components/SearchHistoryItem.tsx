import { colors, spacing } from '@app/styles';
import { Entypo } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface Props {
  results: string[];
  onClearItem: (id: string) => void;
  onSelectItem: (query: string) => void;
  onClearAll: () => void;
}

export default function SearchHistory({
  results,
  onClearAll,
  onClearItem,
  onSelectItem,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search History</Text>
        {results.length > 0 && (
          <TouchableOpacity onPress={onClearAll}>
            <Text style={styles.clearAll}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={results}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelectItem(item)}
            >
              <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onClearItem(item)}>
              <Entypo name="cross" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  clearAll: TextStyle;
  itemContainer: ViewStyle;
  item: ViewStyle;
  itemText: TextStyle;
}>({
  container: {
    margin: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  title: {
    fontWeight: 'bold',
  },
  clearAll: {
    color: colors.error,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.textDim,
  },
  item: {
    flex: 1,
  },
  itemText: {},
});
