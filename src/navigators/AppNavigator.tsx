import { AuthContextProvider } from '@app/context';
import {
  AuthLoadingScreen,
  CategoryScreen,
  ChangelogScreen,
  LoginScreen,
  StorybookScreen,
} from '@app/screens';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import newRelic from 'newrelic-react-native-agent';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  DevToolsParamList,
  DevToolsStackNavigator,
} from './DevToolsStackNavigator';
import {
  PreferenceStackNavigator,
  PreferenceStackParamList,
} from './PreferenceStackNavigator';
import {
  StreamStackNavigator,
  StreamStackParamList,
} from './StreamStackNavigator';
import { TabNavigator, TabParamList } from './TabNavigator';
import { TopStackNavigator, TopStackParamList } from './TopStackNavigator';
import { BaseConfig } from './config';
import { navigationRef, useBackButtonHandler } from './navigationUtilities';

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
  AuthLoading: undefined;

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

  // changelog
  Changelog: undefined;

  // sb
  Storybook: undefined;

  // preferences
  Preferences: NavigatorScreenParams<PreferenceStackParamList>;

  // dev-tools
  DevTools: NavigatorScreenParams<DevToolsParamList>;
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

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // navigationBarColor: colors.background,
      }}
      initialRouteName="AuthLoading"
    >
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />

      {/* tabs */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* streams */}
      <Stack.Screen name="Streams" component={StreamStackNavigator} />

      {/* top */}
      <Stack.Screen name="Top" component={TopStackNavigator} />

      {/* category slug */}
      <Stack.Screen name="Category" component={CategoryScreen} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* Changelog */}
      <Stack.Screen name="Changelog" component={ChangelogScreen} />

      {/* sb */}
      <Stack.Screen name="Storybook" component={StorybookScreen} />

      {/* preferences */}
      <Stack.Screen name="Preferences" component={PreferenceStackNavigator} />

      {/* DevTools */}
      <Stack.Screen name="DevTools" component={DevToolsStackNavigator} />
    </Stack.Navigator>
  );
}

type NavigationProps = Partial<
  React.ComponentProps<typeof NavigationContainer>
>;

export function AppNavigator(props: NavigationProps) {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorScheme]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={newRelic.onStateChange}
      theme={navTheme}
      {...props}
    >
      <AuthContextProvider>
        <AppStack />
      </AuthContextProvider>
    </NavigationContainer>
  );
}
