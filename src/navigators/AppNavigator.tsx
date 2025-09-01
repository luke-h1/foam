import { useAuthContext } from '@app/context';
import { usePopulateAuth } from '@app/hooks';
import { CategoryScreen, LoginScreen, StorybookScreen } from '@app/screens';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { ComponentProps, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DevToolsParamList } from './DevToolsStackNavigator';
import { OtherStackParamList } from './OtherStackNavigator';
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
import { useBackButtonHandler } from './navigationUtilities';

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

  console.log('ready ->', ready);

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
      <Stack.Screen name="Top" component={TopStackNavigator} />

      {/* category slug */}
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          presentation: 'modal',
        }}
      />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* sb */}
      <Stack.Screen
        name="Storybook"
        component={StorybookScreen}
        options={{
          presentation: 'modal',
        }}
      />

      {/* Preference stack */}
      <Stack.Screen
        name="Preferences"
        component={PreferenceStackNavigator}
        options={{
          presentation: 'modal',
        }}
      />
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
    <NavigationContainer theme={navTheme} {...props}>
      <AppStack />
    </NavigationContainer>
  );
};
