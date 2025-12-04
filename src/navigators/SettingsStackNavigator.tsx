import {
  SettingsAppearanceScreen,
  SettingsDevtoolsScreen,
  SettingsIndexScreen,
  SettingsOtherScreen,
  SettingsProfileScreen,
} from '@app/screens';
import { ChatScreen } from '@app/screens/ChatScreen';
import {
  CachedImagesScreen,
  DebugScreen,
  DiagnosticsScreen,
} from '@app/screens/DevTools';
import { AboutScreen, FaqScreen, LicensesScreen } from '@app/screens/Other';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type SettingsStackParamList = {
  Index: undefined;
  Profile: undefined;
  Appearance: undefined;
  DevTools: undefined;
  Other: undefined;

  About: undefined;
  CachedImages: undefined;
  Diagnostics: undefined;
  Licenses: undefined;
  Faq: undefined;
  Changelog: undefined;
  Debug: undefined;
  Chat: {
    channelId: string;
    channelName: string;
  };
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
      <Stack.Screen name="CachedImages" component={CachedImagesScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Licenses" component={LicensesScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Faq" component={FaqScreen} />
    </Stack.Navigator>
  );
}
