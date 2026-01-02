import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { ListRenderItem } from '@shopify/flash-list';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { FlashList } from '../FlashList';
import { Typography } from '../Typography';

interface Props {
  tags: string[];
  limit?: number;
}

export function Tags({ tags, limit = 10 }: Props) {
  const navigation = useAppNavigation();

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item }) => {
      return (
        <Button
          onPress={() => {
            navigation.navigate('Category', { id: item });
          }}
        >
          <View style={styles.tag}>
            <Typography>{item}</Typography>
          </View>
        </Button>
      );
    },
    [navigation],
  );

  if (tags.length === 0) {
    return null;
  }

  const limitedTags = tags.slice(0, limit);

  return (
    <View style={styles.container}>
      <FlashList<string>
        data={limitedTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  tag: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    borderColor: theme.colors.black.bgAltAlpha,
  },
}));
