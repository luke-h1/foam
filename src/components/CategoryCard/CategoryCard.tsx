import { useAppNavigation } from '@app/hooks';
import { Category } from '@app/services/twitch-service';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Image } from '../Image';
import { Typography } from '../Typography';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 150;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export function CategoryCard({ category }: Props) {
  const { navigate } = useAppNavigation();

  return (
    <Button
      onPress={() => {
        navigate('Category', {
          id: category.id,
        });
      }}
      style={styles.container}
    >
      <View style={styles.wrapper}>
        <Image
          source={category.box_art_url
            ?.replace('{width}', '200')
            ?.replace('{height}', '250')}
          style={styles.image}
          contentFit="contain"
        />
        <Typography style={styles.title}>{category.name}</Typography>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  title: {
    marginTop: theme.spacing.sm,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  wrapper: {
    marginBottom: 8,
  },
}));
