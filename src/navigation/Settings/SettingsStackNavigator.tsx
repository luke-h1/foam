import LoginScreen from '@app/screens/settings/LoginScreen';
import SettingsScreen from '@app/screens/settings/SettingsScreen';
import { SettingsRoutes, SettingsStack } from './SettingsStack';

export default function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name={SettingsRoutes.Settings}
        component={SettingsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <SettingsStack.Screen
        name={SettingsRoutes.Login}
        component={LoginScreen}
      />
    </SettingsStack.Navigator>
  );
}
