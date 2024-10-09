import HomeTabsNavigator from '@app/navigation/Home/HomeTabsNavigator';
import AuthLoadingScreen from '@app/screens/AuthLoadingScreen';
import { RootRoutes, RootStack } from './RootStack';

export default function RootNavigator() {
  return (
    <RootStack.Navigator
      initialRouteName={RootRoutes.AuthLoading}
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen
        name={RootRoutes.AuthLoading}
        component={AuthLoadingScreen}
      />
      <RootStack.Screen name={RootRoutes.Home} component={HomeTabsNavigator} />
    </RootStack.Navigator>
  );
}
