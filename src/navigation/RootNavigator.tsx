import HomeTabsNavigator from '@app/navigation/Home/HomeTabsNavigator';
import { RootRoutes, RootStack } from './RootStack';

export default function RootNavigator() {
  return (
    <RootStack.Navigator
      initialRouteName={RootRoutes.Home}
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name={RootRoutes.Home} component={HomeTabsNavigator} />
    </RootStack.Navigator>
  );
}
