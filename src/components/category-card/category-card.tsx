import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

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
  CATEGORY_CARD_HEIGHT,
  CATEGORY_CARD_IMAGE_HEIGHT,
  CATEGORY_CARD_IMAGE_WIDTH,
  CATEGORY_CARD_TITLE_HEIGHT,
  IMAGE_SOURCE_HEIGHT,
  IMAGE_SOURCE_WIDTH,
  TITLE_LINE_HEIGHT,
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
      <View style={styles.wrapper}>
        <Image
          source={category.box_art_url
            .replace('{width}', String(IMAGE_SOURCE_WIDTH))
            .replace('{height}', String(IMAGE_SOURCE_HEIGHT))}
          style={styles.image}
          contentFit='cover'
        />
        <Text numberOfLines={TITLE_MAX_LINES} style={styles.title}>
          {category.name}
        </Text>
      </View>
    </Button>
  );
}

export const MemoizedCategoryCard = memo(CategoryCard);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  image: {
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: CATEGORY_CARD_IMAGE_HEIGHT,
    width: CATEGORY_CARD_IMAGE_WIDTH,
  },
  title: {
    lineHeight: TITLE_LINE_HEIGHT,
    marginTop: theme.space12,
    minHeight: CATEGORY_CARD_TITLE_HEIGHT,
    textAlign: 'center',
    width: CATEGORY_CARD_IMAGE_WIDTH + theme.space24,
  },
  wrapper: {
    alignItems: 'center',
    minHeight: CATEGORY_CARD_HEIGHT,
    paddingBottom: theme.space16,
  },
});
