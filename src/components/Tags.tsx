import theme from '@app/styles/theme';
import React from 'react';
import { FlatList, StyleSheet, View, ViewStyle } from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

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
          <ThemedView
            style={styles.tag}
            dark={theme.color.darkBlue}
            light={theme.color.white}
          >
            <ThemedText fontSize={14}>{item}</ThemedText>
          </ThemedView>
        )}
      />
      {/* sep */}
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
  },
});
