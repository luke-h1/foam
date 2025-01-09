import { colors, spacing } from '@app/styles';
import { radii } from '@app/styles/radii';
import React from 'react';
import { FlatList, View, ViewStyle } from 'react-native';
import { Text } from './ui/Text';

interface Props {
  tags: string[];
  limit?: number;
}

export default function Tags({ tags, limit = 10 }: Props) {
  if (!tags) {
    return null;
  }

  const limitedTags = tags.slice(0, limit);

  return (
    <View style={$container}>
      <FlatList<string>
        data={limitedTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={$tag}>
            <Text
              size="xxs"
              preset="tag"
              style={{
                color: colors.text,
              }}
            >
              {item}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const $container: ViewStyle = {
  marginBottom: spacing.medium,
};

const $tag: ViewStyle = {
  borderRadius: radii.md,
  paddingVertical: spacing.micro,
  paddingHorizontal: spacing.extraSmall,
  marginRight: spacing.extraSmall,
  borderWidth: 0.2,
  marginBottom: 8,
  borderColor: colors.tint,
  // backgroundColor: colors.border,
};
