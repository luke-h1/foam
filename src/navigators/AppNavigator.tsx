import { useAuthContext } from '@app/context/AuthContext';
import { usePopulateAuth } from '@app/hooks/usePopulateAuth';
import { CategoryScreen } from '@app/screens/CategoryScreen';
import { ChatScreen } from '@app/screens/ChatScreen/ChatScreen';
import { LoginScreen } from '@app/screens/LoginScreen';
import { StorybookScreen } from '@app/screens/StorybookScreen/StorybookScreen';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { ComponentProps, useMemo } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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
    <NavigationContainer theme={navTheme} {...props}>
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
