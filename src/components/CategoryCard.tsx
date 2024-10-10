import {
  CategoryRoutes,
  CategoryStackParamList,
} from '@app/navigation/Category/CategoryStack';
import { Category } from '@app/services/twitchService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 90;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export default function CategoryCard({ category }: Props) {
  const { navigate } = useNavigation<NavigationProp<CategoryStackParamList>>();

  return (
    <Pressable
      onPress={() =>
        navigate(CategoryRoutes.Category, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          screen: CategoryRoutes.Category,
          params: {
            id: category.id,
          },
        })
      }
    >
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <Image
            source={{
              uri: category.box_art_url
                .replace('{width}', '200')
                .replace('{height}', '250'),
            }}
            style={styles.image}
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
          <Text>{category.name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  image: ImageStyle;
  wrapper: ViewStyle;
}>({
  container: {
    marginBottom: 17,
    marginLeft: 16,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  wrapper: {
    marginRight: 16,
  },
});
