import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { router } from 'expo-router';

import { Text } from '@app/components/ui/text/text';
import { impact } from '@app/lib/haptics';
import { showActionMenu } from '@app/store/overlays/show-action-menu';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';

import { Button } from '../button/button';
import { Image } from '../image/image';
import {
  IMAGE_ASPECT_RATIO,
  IMAGE_SOURCE_HEIGHT,
  IMAGE_SOURCE_WIDTH,
  TITLE_MAX_LINES,
} from './constants';

interface Props {
  category: Category;
}

export function CategoryCard({ category }: Props) {
  const handlePress = useCallback(() => {
    router.push(`/category/${category.id}`);
  }, [category.id]);

  const handleLongPress = useCallback(() => {
    impact('medium');

    showActionMenu({
      title: category.name,
      actions: [
        {
          label: 'Share category',
          onPress: () => {
            void shareDeepLink({
              kind: 'category',
              id: category.id,
              name: category.name,
            });
          },
        },
      ],
      cancelLabel: 'Cancel',
    });
  }, [category.id, category.name]);

  if (!category.id) {
    return null;
  }

  return (
    <Button
      label={`${category.name} category`}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.container}
    >
      <Image
        source={category.box_art_url
          .replace('{width}', String(IMAGE_SOURCE_WIDTH))
          .replace('{height}', String(IMAGE_SOURCE_HEIGHT))}
        style={styles.image}
        containerStyle={styles.image}
        contentFit='cover'
      />
      <Text
        type='subhead'
        weight='medium'
        numberOfLines={TITLE_MAX_LINES}
        style={styles.title}
      >
        {category.name}
      </Text>
    </Button>
  );
}

export const MemoizedCategoryCard = memo(CategoryCard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: theme.space16,
    paddingHorizontal: 6,
  },
  image: {
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  title: {
    marginTop: theme.space8,
  },
});
