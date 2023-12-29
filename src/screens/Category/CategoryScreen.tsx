import { SafeAreaView } from 'react-native';
import { Text } from 'tamagui';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '../../navigation/Category/CategoryStack';

const CategoryScreen = ({
  route,
}: CategoryStackScreenProps<CategoryRoutes.Category>) => {
  const { id } = route.params;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <Text>Category page {id}</Text>
    </SafeAreaView>
  );
};
export default CategoryScreen;
