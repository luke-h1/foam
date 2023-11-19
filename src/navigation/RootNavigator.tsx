/* eslint-disable @typescript-eslint/ban-ts-comment */
import AuthLoadingScreen from '../screens/authentication/AuthLoading';
import LoginScreen from '../screens/authentication/LoginScreen';
import SettingsModal from '../screens/settings/SettingsModal';
import HomeTabsNavigator from './Home/HomeTabsNavigator';
import { RootRoutes, RootStack } from './RootStack';

const RootNavigator = () => {
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
      <RootStack.Screen
        name={RootRoutes.Home}
        component={HomeTabsNavigator}
        options={{}}
      />
      <RootStack.Screen
        name={RootRoutes.SettingsModal}
        component={SettingsModal}
      />
      {/* @ts-ignore */}
      <RootStack.Screen name={RootRoutes.Login} component={LoginScreen} />
    </RootStack.Navigator>
  );
};
export default RootNavigator;
