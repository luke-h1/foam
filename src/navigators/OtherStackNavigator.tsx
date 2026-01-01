import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { lazy } from 'react';

const LazyAboutScreen = lazy(() =>
  import('@app/screens/Other/AboutScreen').then(m => ({
    default: m.AboutScreen,
  })),
);
const LazyChangelogScreen = lazy(() =>
  import('@app/screens/Other/ChangelogScreen').then(m => ({
    default: m.ChangelogScreen,
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

const AboutScreen = () => (
  <ScreenSuspense>
    <LazyAboutScreen />
  </ScreenSuspense>
);
const ChangelogScreen = () => (
  <ScreenSuspense>
    <LazyChangelogScreen />
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

export type OtherStackParamList = {
  About: undefined;
  Changelog: undefined;
  Faq: undefined;
  Licenses: undefined;
};

const Stack = createNativeStackNavigator<OtherStackParamList>();

export type OtherStackScreenProps<T extends keyof OtherStackParamList> =
  StackScreenProps<OtherStackParamList, T>;

export function OtherStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Changelog"
        component={ChangelogScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Faq"
        component={FaqScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Licenses"
        component={LicensesScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
    </Stack.Navigator>
  );
}
