import { Category } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { Text } from '@app/components/ui/Text/Text';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 150;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export function CategoryCard({ category }: Props) {
  const handlePress = useCallback(() => {
    router.push(`/category/${category.id}`);
  }, [category.id]);

  if (!category?.id) {
    return null;
  }

  return (
    <Button onPress={handlePress} style={styles.container}>
      <View style={styles.wrapper}>
        <Image
          source={category.box_art_url
            ?.replace('{width}', '200')
            ?.replace('{height}', '250')}
          style={styles.image}
          contentFit="contain"
        />
        <Text style={styles.title}>{category.name}</Text>
      </View>
    </Button>
  );
}

export const MemoizedCategoryCard = memo(CategoryCard);
MemoizedCategoryCard.displayName = 'MemoizedCategoryCard';

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
    marginTop: theme.space12,
    textAlign: 'center',
  },
  wrapper: {
    marginBottom: theme.space16,
  },
});
