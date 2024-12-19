import CategoriesSecreen from '@app/screens/Top/Categories';
import TopStreamsScreen from '@app/screens/Top/Streams';
import TopScreen from '@app/screens/Top/TopScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type TopStackParamList = {
  TopStreamsAndCategories: undefined;
  categories: undefined;
  streams: undefined;
};

const Stack = createNativeStackNavigator<TopStackParamList>();

export type TopStackScreenProps<T extends keyof TopStackParamList> =
  StackScreenProps<TopStackParamList, T>;

export default function TopStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="TopStreamsAndCategories">
      <Stack.Screen name="TopStreamsAndCategories" component={TopScreen} />
      <Stack.Screen name="categories" component={CategoriesSecreen} />
      <Stack.Screen name="streams" component={TopStreamsScreen} />
    </Stack.Navigator>
  );
}
