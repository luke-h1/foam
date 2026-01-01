import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { TopScreen } from '@app/screens/Top/TopScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { lazy } from 'react';

const LazyTopCategoriesScreen = lazy(() =>
  import('@app/screens/Top/TopCategoriesScreen').then(m => ({
    default: m.TopCategoriesScreen,
  })),
);
const LazyTopStreamsScreen = lazy(() =>
  import('@app/screens/Top/TopStreamsScreen').then(m => ({
    default: m.TopStreamsScreen,
  })),
);

const TopCategoriesScreen = () => (
  <ScreenSuspense>
    <LazyTopCategoriesScreen />
  </ScreenSuspense>
);
const TopStreamsScreen = () => (
  <ScreenSuspense>
    <LazyTopStreamsScreen />
  </ScreenSuspense>
);

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
