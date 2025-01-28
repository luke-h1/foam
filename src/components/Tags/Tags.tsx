import { useAppNavigation } from '@app/hooks';
import React from 'react';
import { FlatList, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography } from '../Typography';

interface Props {
  tags: string[];
  limit?: number;
}

export function Tags({ tags, limit = 10 }: Props) {
  const { styles } = useStyles(stylesheet);
  const { navigate } = useAppNavigation();

  if (!tags) {
    return null;
  }

  const limitedTags = tags.slice(0, limit);

  return (
    <View style={styles.container}>
      <FlatList<string>
        data={limitedTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <Button
            onPress={() => {
              navigate('Category', {
                id: item,
              });
            }}
          >
            <View style={styles.tag}>
              <Typography>{item}</Typography>
            </View>
          </Button>
        )}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  tag: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderWidth: 0.2,
    marginBottom: 8,
    borderColor: theme.colors.borderFaint,
  },
}));
