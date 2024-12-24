import { colors, spacing } from '@app/styles';
import { Entypo } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from './ui/Text';

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
    <View style={$container}>
      <View style={$header}>
        <Text style={$title}>Search History</Text>
        {results.length > 0 && (
          <TouchableOpacity onPress={onClearAll}>
            <Text style={$clearAll}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList<string>
        data={results}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={$itemContainer}>
            <TouchableOpacity style={$item} onPress={() => onSelectItem(item)}>
              <Text>{item}</Text>
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

const $container: ViewStyle = {
  margin: spacing.medium,
};
const $header: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.small,
};
const $title: TextStyle = {
  fontWeight: 'bold',
};

const $clearAll: TextStyle = {
  color: colors.error,
};

const $itemContainer: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: spacing.small,
  borderBottomWidth: 1,
  borderBottomColor: colors.textDim,
};

const $item: ViewStyle = {
  flex: 1,
};
