import { ChatScreen } from '@app/screens/ChatScreen/ChatScreen';
import { CachedImagesScreen } from '@app/screens/DevTools/CachedImagesScreen';
import { DebugScreen } from '@app/screens/DevTools/DebugScreen';
import { Diagnostics as DiagnosticsScreen } from '@app/screens/DevTools/components/Diagnostics';
import { AboutScreen } from '@app/screens/Other/AboutScreen';
import { FaqScreen } from '@app/screens/Other/FaqScreen';
import { LicensesScreen } from '@app/screens/Other/LicensesScreen';
import { ChatPreferenceScreen } from '@app/screens/Preferences/ChatPreferenceScreen';
import { SettingsAppearanceScreen } from '@app/screens/SettingsScreen/SettingsApperanceScreen';
import { SettingsDevtoolsScreen } from '@app/screens/SettingsScreen/SettingsDevtoolsScreen';
import { SettingsIndexScreen } from '@app/screens/SettingsScreen/SettingsIndexScreen';
import { SettingsOtherScreen } from '@app/screens/SettingsScreen/SettingsOtherScreen';
import { SettingsProfileScreen } from '@app/screens/SettingsScreen/SettingsProfileScreen';
import { StorybookScreen } from '@app/screens/StorybookScreen/StorybookScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type SettingsStackParamList = {
  Index: undefined;
  Profile: undefined;
  Appearance: undefined;
  ChatPreferences: undefined;
  DevTools: undefined;
  Other: undefined;

  About: undefined;
  CachedImages: undefined;
  Diagnostics: undefined;
  Licenses: undefined;
  Faq: undefined;
  Changelog: undefined;
  Debug: undefined;
  Storybook: undefined;
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
      <Stack.Screen name="ChatPreferences" component={ChatPreferenceScreen} />
      <Stack.Screen name="DevTools" component={SettingsDevtoolsScreen} />
      <Stack.Screen name="Other" component={SettingsOtherScreen} />
      <Stack.Screen name="CachedImages" component={CachedImagesScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="Storybook" component={StorybookScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Licenses" component={LicensesScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Faq" component={FaqScreen} />
    </Stack.Navigator>
  );
}
