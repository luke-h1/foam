import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { Category } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { Text } from '../Text/Text';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 150;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export function CategoryCard({ category }: Props) {
  const navigation = useAppNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate('Category', { id: category.id });
  }, [navigation, category.id]);

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  image: {
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
  },
  title: {
    marginTop: theme.spacing.sm,
  },
  wrapper: {
    marginBottom: 8,
  },
});
