import {
  SettingsAppearanceScreen,
  SettingsDevtoolsScreen,
  SettingsIndexScreen,
  SettingsOtherScreen,
  SettingsProfileScreen,
} from '@app/screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type SettingsStackParamList = {
  Index: undefined;
  Profile: undefined;
  Appearance: undefined;
  DevTools: undefined;
  Other: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
  StackScreenProps<SettingsStackParamList, T>;

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Index" component={SettingsIndexScreen} />
      <Stack.Screen name="Profile" component={SettingsProfileScreen} />
      <Stack.Screen name="Appearance" component={SettingsAppearanceScreen} />
      <Stack.Screen name="DevTools" component={SettingsDevtoolsScreen} />
      <Stack.Screen name="Other" component={SettingsOtherScreen} />
    </Stack.Navigator>
  );
}
