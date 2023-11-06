import React from 'react';
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthLoadingScreen from '../screens/authentication/AuthLoading';
import LoginScreen from '../screens/authentication/LoginScreen';
import SettingsModal from '../screens/settings/SettingsScreen';
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
      <RootStack.Screen name={RootRoutes.Welcome} component={WelcomeScreen} />
      <RootStack.Screen
        name={RootRoutes.Home}
        component={HomeTabsNavigator}
        options={{}}
      />
      <RootStack.Screen
        name={RootRoutes.SettingsModal}
        component={SettingsModal}
      />
      <RootStack.Screen name={RootRoutes.Login} component={LoginScreen} />
    </RootStack.Navigator>
  );
};
export default RootNavigator;
