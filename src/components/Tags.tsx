import { colors, spacing } from '@app/styles';
import { radii } from '@app/styles/radii';
import React from 'react';
import { FlatList, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Text } from './ui/Text';

interface Props {
  tags: string[];
}

export default function Tags({ tags }: Props) {
  if (!tags) {
    return null;
  }

  const limitedTags = tags.slice(0, 5);

  return (
    <View style={styles.container}>
      <FlatList
        data={limitedTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  tag: ViewStyle;
  tagText: TextStyle;
}>({
  container: {
    marginBottom: spacing.large,
    position: 'relative',
  },
  tag: {
    borderRadius: radii.lg,
    paddingVertical: spacing.extraSmall,
    paddingHorizontal: spacing.small,
    marginRight: spacing.small,
    borderWidth: 0.2,
    backgroundColor: colors.textDim,
  },
  tagText: {},
});
