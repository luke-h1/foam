import AuthLoading from '@app/screens/authentication/AuthLoading';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import CategoryStackNavigator from './Category/CategoryStackNavigator';
import HomeTabsNavigator from './Home/HomeTabsNavigator';
import { RootRoutes, RootStack } from './RootStack';
import SettingsStackNavigator from './Settings/SettingsStackNavigator';
import StreamStackNavigator from './Stream/StreamStackNavigator';

export default function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name={RootRoutes.AuthLoading} component={AuthLoading} />
      <RootStack.Screen
        name={RootRoutes.Home}
        component={HomeTabsNavigator}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: '',
          headerLeft: () => null, // Hide the back button
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate(RootRoutes.Settings)}
              style={{ marginRight: 10 }}
            >
              <Feather name="settings" size={22} color="black" />
            </TouchableOpacity>
          ),
        })}
      />

      <RootStack.Screen
        name={RootRoutes.Settings}
        component={SettingsStackNavigator}
      />

      <RootStack.Screen
        name={RootRoutes.Category}
        component={CategoryStackNavigator}
      />

      <RootStack.Screen
        name={RootRoutes.Stream}
        component={StreamStackNavigator}
      />
    </RootStack.Navigator>
  );
}
