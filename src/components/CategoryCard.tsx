import useAppNavigation from '@app/hooks/useAppNavigation';
import { Category } from '@app/services/twitchService';
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
const IMAGE_HEIGHT = 90;
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
    >
      <View style={$container}>
        <View style={$wrapper}>
          <Image
            source={{
              uri: category.box_art_url
                .replace('{width}', '200')
                .replace('{height}', '250'),
            }}
            style={$image}
          />
        </View>
        <View
          style={{
            justifyContent: 'space-between',
            flex: 1,
            flexDirection: 'row',
            marginTop: 4,
          }}
        >
          <Text style={$text}>{category.name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const $container: ViewStyle = {
  marginBottom: 17,
  marginLeft: 16,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const $image: ImageStyle = {
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  borderRadius: 8,
};

const $wrapper: ViewStyle = {
  marginRight: 16,
};

const $text: TextStyle = {
  fontSize: 16,
};
