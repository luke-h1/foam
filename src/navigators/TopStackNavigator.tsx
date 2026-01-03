import { TopCategoriesScreen } from '@app/screens/Top/TopCategoriesScreen';
import { TopScreen } from '@app/screens/Top/TopScreen';
import { TopStreamsScreen } from '@app/screens/Top/TopStreamsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type TopStackParamList = {
  TopHome: undefined;
  TopCategories: undefined;
  TopStreams: undefined;
};

const Stack = createNativeStackNavigator<TopStackParamList>();

export type TopStackScreenProps<T extends keyof TopStackParamList> =
  StackScreenProps<TopStackParamList, T>;

export function TopStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="TopHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="TopHome"
        component={TopScreen}
        options={{
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="TopCategories"
        component={TopCategoriesScreen}
        options={{
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="TopStreams"
        component={TopStreamsScreen}
        options={{
          orientation: 'portrait_up',
        }}
      />
    </Stack.Navigator>
  );
}
