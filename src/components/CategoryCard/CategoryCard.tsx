import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';

import { Button } from '../Button/Button';
import { Image } from '../Image/Image';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 150;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;
const IMAGE_SOURCE_SCALE = 2;
const IMAGE_SOURCE_WIDTH = Math.round(IMAGE_WIDTH * IMAGE_SOURCE_SCALE);
const IMAGE_SOURCE_HEIGHT = IMAGE_HEIGHT * IMAGE_SOURCE_SCALE;
const TITLE_LINE_HEIGHT = 24;
const TITLE_MAX_LINES = 2;
const TITLE_HEIGHT = TITLE_LINE_HEIGHT * TITLE_MAX_LINES;
export const CATEGORY_CARD_HEIGHT =
  IMAGE_HEIGHT + theme.space12 + TITLE_HEIGHT + theme.space16;

export function CategoryCard({ category }: Props) {
  const handlePress = useCallback(() => {
    router.push(`/category/${category.id}`);
  }, [category.id]);

  if (!category?.id) {
    return null;
  }

  return (
    <Button
      label={`${category.name} category`}
      onPress={handlePress}
      style={styles.container}
    >
      <View style={styles.wrapper}>
        <Image
          source={category.box_art_url
            ?.replace('{width}', String(IMAGE_SOURCE_WIDTH))
            ?.replace('{height}', String(IMAGE_SOURCE_HEIGHT))}
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
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
  },
  title: {
    lineHeight: TITLE_LINE_HEIGHT,
    marginTop: theme.space12,
    minHeight: TITLE_HEIGHT,
    textAlign: 'center',
    width: IMAGE_WIDTH + theme.space24,
  },
  wrapper: {
    alignItems: 'center',
    minHeight: CATEGORY_CARD_HEIGHT,
    paddingBottom: theme.space16,
  },
});
