import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { SettingsIndexScreen } from '@app/screens/SettingsScreen/SettingsIndexScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { lazy } from 'react';

const LazyCachedImagesScreen = lazy(() =>
  import('@app/screens/DevTools/CachedImagesScreen').then(m => ({
    default: m.CachedImagesScreen,
  })),
);
const LazyDebugScreen = lazy(() =>
  import('@app/screens/DevTools/DebugScreen').then(m => ({
    default: m.DebugScreen,
  })),
);
const LazyDiagnosticsScreen = lazy(() =>
  import('@app/screens/DevTools/DiagnosticsScreen').then(m => ({
    default: m.DiagnosticsScreen,
  })),
);
const LazyRemoteConfigScreen = lazy(() =>
  import('@app/screens/DevTools/RemoteConfigScreen').then(m => ({
    default: m.RemoteConfigScreen,
  })),
);
const LazyAboutScreen = lazy(() =>
  import('@app/screens/Other/AboutScreen').then(m => ({
    default: m.AboutScreen,
  })),
);
const LazyFaqScreen = lazy(() =>
  import('@app/screens/Other/FaqScreen').then(m => ({ default: m.FaqScreen })),
);
const LazyLicensesScreen = lazy(() =>
  import('@app/screens/Other/LicensesScreen').then(m => ({
    default: m.LicensesScreen,
  })),
);
const LazyChatPreferenceScreen = lazy(() =>
  import('@app/screens/Preferences/ChatPreferenceScreen').then(m => ({
    default: m.ChatPreferenceScreen,
  })),
);
const LazySettingsAppearanceScreen = lazy(() =>
  import('@app/screens/SettingsScreen/SettingsApperanceScreen').then(m => ({
    default: m.SettingsAppearanceScreen,
  })),
);
const LazySettingsDevtoolsScreen = lazy(() =>
  import('@app/screens/SettingsScreen/SettingsDevtoolsScreen').then(m => ({
    default: m.SettingsDevtoolsScreen,
  })),
);
const LazySettingsOtherScreen = lazy(() =>
  import('@app/screens/SettingsScreen/SettingsOtherScreen').then(m => ({
    default: m.SettingsOtherScreen,
  })),
);
const LazySettingsProfileScreen = lazy(() =>
  import('@app/screens/SettingsScreen/SettingsProfileScreen').then(m => ({
    default: m.SettingsProfileScreen,
  })),
);
const LazyStorybookScreen = lazy(() =>
  import('@app/screens/StorybookScreen/StorybookScreen').then(m => ({
    default: m.StorybookScreen,
  })),
);

const CachedImagesScreen = () => (
  <ScreenSuspense>
    <LazyCachedImagesScreen />
  </ScreenSuspense>
);
const DebugScreen = () => (
  <ScreenSuspense>
    <LazyDebugScreen />
  </ScreenSuspense>
);
const DiagnosticsScreen = () => (
  <ScreenSuspense>
    <LazyDiagnosticsScreen />
  </ScreenSuspense>
);
const RemoteConfigScreen = () => (
  <ScreenSuspense>
    <LazyRemoteConfigScreen />
  </ScreenSuspense>
);
const AboutScreen = () => (
  <ScreenSuspense>
    <LazyAboutScreen />
  </ScreenSuspense>
);
const FaqScreen = () => (
  <ScreenSuspense>
    <LazyFaqScreen />
  </ScreenSuspense>
);
const LicensesScreen = () => (
  <ScreenSuspense>
    <LazyLicensesScreen />
  </ScreenSuspense>
);
const ChatPreferenceScreen = () => (
  <ScreenSuspense>
    <LazyChatPreferenceScreen />
  </ScreenSuspense>
);
const SettingsAppearanceScreen = () => (
  <ScreenSuspense>
    <LazySettingsAppearanceScreen />
  </ScreenSuspense>
);
const SettingsDevtoolsScreen = () => (
  <ScreenSuspense>
    <LazySettingsDevtoolsScreen />
  </ScreenSuspense>
);
const SettingsOtherScreen = () => (
  <ScreenSuspense>
    <LazySettingsOtherScreen />
  </ScreenSuspense>
);
const SettingsProfileScreen = () => (
  <ScreenSuspense>
    <LazySettingsProfileScreen />
  </ScreenSuspense>
);
const StorybookScreen = () => (
  <ScreenSuspense>
    <LazyStorybookScreen />
  </ScreenSuspense>
);

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
  RemoteConfig: undefined;
  Licenses: undefined;
  Faq: undefined;
  Changelog: undefined;
  Debug: undefined;
  Storybook: undefined;
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
      <Stack.Screen name="RemoteConfig" component={RemoteConfigScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="Storybook" component={StorybookScreen} />
      <Stack.Screen name="Licenses" component={LicensesScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Faq" component={FaqScreen} />
    </Stack.Navigator>
  );
}
