import { SafeAreaView, Text } from 'react-native';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '../../navigation/Category/CategoryStack';
import colors from '../../styles/colors';

const CategoryScreen = ({
  route,
}: CategoryStackScreenProps<CategoryRoutes.Category>) => {
  const { id } = route.params;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.primary,
        flexDirection: 'column',
      }}
    >
      <Text style={{ color: colors.gray }}>Category page {id}</Text>
    </SafeAreaView>
  );
};
export default CategoryScreen;
