import CategoryScreen from '../../screens/Category/CategoryScreen';
import { CategoryRoutes, CategoryStack } from './CategoryStack';

const CategoryStackNavigator = () => {
  return (
    <CategoryStack.Navigator>
      <CategoryStack.Screen
        options={{
          headerShown: false,
        }}
        name={CategoryRoutes.Category}
        component={CategoryScreen}
      />
    </CategoryStack.Navigator>
  );
};
export default CategoryStackNavigator;
