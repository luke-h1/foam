import {
  CategoryRoutes,
  CategoryStackParamList,
} from '@app/navigation/Category/CategoryStack';
import { Category } from '@app/services/twitchService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Pressable, View, Text } from 'react-native';

interface Props {
  category: Category;
}

const IMAGE_ASPECT_RATIO = 110 / 155;
const IMAGE_HEIGHT = 90;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

const CategoryCard = ({ category }: Props) => {
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
      <View
        style={{
          marginBottom: 17,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            marginRight: 16,
          }}
        >
          <Image
            source={{
              uri: category.box_art_url
                .replace('{width}', '200')
                .replace('{height}', '250'),
            }}
            style={{
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
            }}
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
};
export default CategoryCard;
