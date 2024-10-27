import theme from '@app/styles/theme';
import React from 'react';
import { FlatList, StyleSheet, View, ViewStyle } from 'react-native';
import Text from './Text';

interface Props {
  tags: string[];
}

export default function Tags({ tags }: Props) {
  if (!tags.length) {
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
            <Text size="xs">{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  tag: ViewStyle;
}>({
  container: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  tag: {
    borderRadius: theme.borderradii.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.color.lightGrey, // Added background color
  },
});
