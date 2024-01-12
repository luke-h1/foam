import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { H6, Image, Stack, YStack } from 'tamagui';
import {
  CategoryRoutes,
  CategoryStackParamList,
} from '../navigation/Category/CategoryStack';

import { Category } from '../services/twitchService';

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
      <YStack
        marginBottom={17}
        display="flex"
        flexDirection="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Stack marginRight={16} width={IMAGE_WIDTH} height={IMAGE_HEIGHT}>
          <Image
            source={{
              uri: category.box_art_url
                .replace('{width}', '200')
                .replace('{height}', '250'),
            }}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
          />
        </Stack>
        <Stack
          justifyContent="space-between"
          flex={1}
          flexDirection="row"
          marginTop={4}
        >
          <H6 color="$color">{category.name}</H6>
        </Stack>
      </YStack>
    </Pressable>
  );
};
export default CategoryCard;
