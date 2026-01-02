import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { useAuthContext } from '@app/context/AuthContext';
import { usePopulateAuth } from '@app/hooks/usePopulateAuth';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { ComponentProps, lazy, useMemo } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { DevToolsParamList } from './DevToolsStackNavigator';
import { OtherStackParamList } from './OtherStackNavigator';
import type { PreferenceStackParamList } from './PreferenceStackNavigator';
import type { StreamStackParamList } from './StreamStackNavigator';
import { TabNavigator, TabParamList } from './TabNavigator';
import type { TopStackParamList } from './TopStackNavigator';
import { BaseConfig } from './config';
import { navigationRef, useBackButtonHandler } from './navigationUtilities';

const LazyCategoryScreen = lazy(() =>
  import('@app/screens/CategoryScreen').then(m => ({
    default: m.CategoryScreen,
  })),
);
const LazyChatScreen = lazy(() =>
  import('@app/screens/ChatScreen/ChatScreen').then(m => ({
    default: m.ChatScreen,
  })),
);
const LazyLoginScreen = lazy(() =>
  import('@app/screens/LoginScreen').then(m => ({ default: m.LoginScreen })),
);
const LazyStorybookScreen = lazy(() =>
  import('@app/screens/StorybookScreen/StorybookScreen').then(m => ({
    default: m.StorybookScreen,
  })),
);
const LazyStreamStackNavigator = lazy(() =>
  import('./StreamStackNavigator').then(m => ({
    default: m.StreamStackNavigator,
  })),
);
const LazyTopStackNavigator = lazy(() =>
  import('./TopStackNavigator').then(m => ({ default: m.TopStackNavigator })),
);
const LazyPreferenceStackNavigator = lazy(() =>
  import('./PreferenceStackNavigator').then(m => ({
    default: m.PreferenceStackNavigator,
  })),
);

function CategoryScreen(props: AppStackScreenProps<'Category'>) {
  return (
    <ScreenSuspense>
      <LazyCategoryScreen {...props} />
    </ScreenSuspense>
  );
}

function ChatScreen(props: AppStackScreenProps<'Chat'>) {
  return (
    <ScreenSuspense>
      <LazyChatScreen {...props} />
    </ScreenSuspense>
  );
}

function LoginScreen() {
  return (
    <ScreenSuspense>
      <LazyLoginScreen />
    </ScreenSuspense>
  );
}

function StorybookScreen() {
  return (
    <ScreenSuspense>
      <LazyStorybookScreen />
    </ScreenSuspense>
  );
}

function StreamStackNavigator() {
  return (
    <ScreenSuspense>
      <LazyStreamStackNavigator />
    </ScreenSuspense>
  );
}

function TopStackNavigator() {
  return (
    <ScreenSuspense>
      <LazyTopStackNavigator />
    </ScreenSuspense>
  );
}

function PreferenceStackNavigator() {
  return (
    <ScreenSuspense>
      <LazyPreferenceStackNavigator />
    </ScreenSuspense>
  );
}

/**
 * This type allows TypeScript to know what routes are defined in this navigator as
 * well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`.
 *  * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */

export type AppStackParamList = {
  // tabs
  Tabs: NavigatorScreenParams<TabParamList>;

  // streams
  Streams: NavigatorScreenParams<StreamStackParamList>;

  // categories
  Categories: undefined;
  Category: { id: string };

  // Top
  Top: NavigatorScreenParams<TopStackParamList>;

  // login screen
  Login: undefined;

  // sb
  Storybook: undefined;

  // preferences
  Preferences: NavigatorScreenParams<PreferenceStackParamList>;

  // dev-tools
  DevTools: NavigatorScreenParams<DevToolsParamList>;

  // other
  Other: NavigatorScreenParams<OtherStackParamList>;

  // chat - globally accessible
  Chat: { channelName: string; channelId: string };
};

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const { exitRoutes } = BaseConfig;

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  StackScreenProps<AppStackParamList, T>;

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  usePopulateAuth();
  const { ready } = useAuthContext();

  /**
   * Todo: add loading state + fallback here if auth down
   */
  if (!ready) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tab stack */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Stream stack */}
      <Stack.Screen name="Streams" component={StreamStackNavigator} />

      {/* Top stack */}
      <Stack.Screen
        name="Top"
        component={TopStackNavigator}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
        }}
      />

      {/* category slug */}
      <Stack.Screen name="Category" component={CategoryScreen} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* sb */}
      <Stack.Screen name="Storybook" component={StorybookScreen} />

      {/* Preference stack */}
      <Stack.Screen name="Preferences" component={PreferenceStackNavigator} />

      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

type NavigationProps = Partial<ComponentProps<typeof NavigationContainer>>;

export const AppNavigator = (props: NavigationProps) => {
  const colorScheme = useColorScheme();

  useBackButtonHandler(routeName => exitRoutes.includes(routeName));

  const navTheme = useMemo(() => {
    const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...theme,
      colors: {
        ...theme.colors,
      },
    };
  }, [colorScheme]);

  return (
    // @ts-expect-error - navigationRef types are compatible at runtime
    <NavigationContainer ref={navigationRef} theme={navTheme} {...props}>
      <View style={styles.container}>
        <AppStack />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.blue.accent,
    paddingTop: Platform.select({
      ios: 0,
      android: rt.insets.top,
    }),
  },
}));
