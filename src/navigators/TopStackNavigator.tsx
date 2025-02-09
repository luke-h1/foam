import { TopCategoriesScreen, TopScreen } from '@app/screens';
import { TopStreamsScreen } from '@app/screens/Top/TopStreamsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type TopStackParamList = {
  Top: undefined;
  TopCategories: undefined;
  TopStreams: undefined;
};

const Stack = createNativeStackNavigator<TopStackParamList>();

export type TopStackScreenProps<T extends keyof TopStackParamList> =
  StackScreenProps<TopStackParamList, T>;

export function TopStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Top">
      <Stack.Screen name="Top" component={TopScreen} />
      <Stack.Screen name="TopCategories" component={TopCategoriesScreen} />
      <Stack.Screen name="TopStreams" component={TopStreamsScreen} />
    </Stack.Navigator>
  );
}
