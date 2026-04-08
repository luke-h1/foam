import { useAuthContext } from '@app/context/AuthContext';
import { usePopulateAuth } from '@app/hooks/usePopulateAuth';
import { AuthCallbackScreen } from '@app/screens/AuthCallbackScreen';
import { CategoryScreen } from '@app/screens/CategoryScreen';
import { ChatScreen } from '@app/screens/ChatScreen/ChatScreen';
import { LoginScreen } from '@app/screens/LoginScreen';
import { StorybookScreen } from '@app/screens/StorybookScreen/StorybookScreen';
import { theme } from '@app/styles/themes';
import {
  DarkTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { ComponentProps, useCallback, useEffect, useMemo } from 'react';
import { Linking, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevToolsParamList } from './DevToolsStackNavigator';
import { OtherStackParamList } from './OtherStackNavigator';
import type { PreferenceStackParamList } from './PreferenceStackNavigator';
import { PreferenceStackNavigator } from './PreferenceStackNavigator';
import type { StreamStackParamList } from './StreamStackNavigator';
import { StreamStackNavigator } from './StreamStackNavigator';
import { TabNavigator, TabParamList } from './TabNavigator';
import type { TopStackParamList } from './TopStackNavigator';
import { TopStackNavigator } from './TopStackNavigator';
import { completeAuthWithCallbackUrl, isAuthCallbackUrl } from './authLinking';
import { BaseConfig } from './config';
import { linking } from './linking';
import { navigationRef, useBackButtonHandler } from './navigationUtilities';
import { parseTwitchUrl } from './twitchLinking';

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

  // Twitch OAuth redirect (foam://auth#access_token=...); listener completes login
  AuthCallback: undefined;

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

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

const AppStack = () => {
  usePopulateAuth();
  useAuthContext();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

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
      <Stack.Screen
        name="AuthCallback"
        component={AuthCallbackScreen}
        options={{ headerShown: false }}
      />

      {/* sb */}
      <Stack.Screen name="Storybook" component={StorybookScreen} />

      {/* Preference stack */}
      <Stack.Screen name="Preferences" component={PreferenceStackNavigator} />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false, title: '' }}
      />
    </Stack.Navigator>
  );
};

type NavigationProps = Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
>;

export const AppNavigator = (props: NavigationProps) => {
  const { loginWithTwitch } = useAuthContext();
  const insets = useSafeAreaInsets();

  useBackButtonHandler(routeName => exitRoutes.includes(routeName));

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
      },
    }),
    [],
  );

  const { onStateChange: externalOnStateChange, ...restProps } = props;

  const handleStateChange = useCallback(
    (state: Parameters<NonNullable<NavigationProps['onStateChange']>>[0]) => {
      externalOnStateChange?.(state);
    },
    [externalOnStateChange],
  );

  useEffect(() => {
    function handleIncomingUrl(url: string | null) {
      if (!url) return;

      if (isAuthCallbackUrl(url)) {
        void completeAuthWithCallbackUrl(url, loginWithTwitch).then(handled => {
          if (handled && navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Tabs', params: { screen: 'Following' } }],
            });
          }
        });
        return;
      }

      const link = parseTwitchUrl(url);
      if (!link) return;
      if (!navigationRef.isReady()) return;
      const channelLogin =
        // eslint-disable-next-line no-nested-ternary
        link.type === 'channel'
          ? link.channelLogin
          : link.type === 'video'
            ? link.channelLogin
            : null;

      if (channelLogin) {
        navigationRef.navigate('Streams', {
          screen: 'LiveStream',
          params: { id: channelLogin },
        });
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    void Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        setTimeout(() => handleIncomingUrl(initialUrl), 100);
      }
    });

    return () => subscription.remove();
  }, [loginWithTwitch]);

  return (
    <NavigationContainer<AppStackParamList>
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
      onStateChange={handleStateChange}
      {...restProps}
    >
      <View
        style={[
          styles.container,
          Platform.OS === 'android' && { paddingTop: insets.top },
        ]}
      >
        <AppStack />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.blue.accent,
    flex: 1,
  },
});
