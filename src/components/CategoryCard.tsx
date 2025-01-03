import useAppNavigation from '@app/hooks/useAppNavigation';
import { Category } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { Image } from 'expo-image';
import {
  Pressable,
  View,
  ViewStyle,
  ImageStyle,
  TextStyle,
} from 'react-native';
import { Text } from './ui/Text';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 150;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export default function CategoryCard({ category }: Props) {
  const { navigate } = useAppNavigation();
  return (
    <Pressable
      onPress={() => {
        navigate('Category', {
          id: category.id,
        });
      }}
      style={$container}
    >
      <View style={$wrapper}>
        <Image
          source={{
            uri: category.box_art_url
              .replace('{width}', '200')
              .replace('{height}', '250'),
          }}
          style={$image}
        />
        <Text preset="infoText" style={$title}>
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
}

const $title: TextStyle = {
  marginTop: spacing.small,
};

const $container: ViewStyle = {
  flex: 1,
  alignItems: 'center',
};

const $image: ImageStyle = {
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
};

const $wrapper: ViewStyle = {
  marginBottom: 8,
};
