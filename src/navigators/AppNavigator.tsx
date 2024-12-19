import { AuthContextProvider, useAuthContext } from '@app/context/AuthContext';
import AuthLoadingScreen from '@app/screens/AuthLoadingScreen';
import LiveStreamScreen from '@app/screens/Stream/LiveStreamScreen';
import StreamerProfileScreen from '@app/screens/Stream/StreamerProfileScreen';
import CategoriesSecreen from '@app/screens/Top/Categories';
import TopStreamsScreen from '@app/screens/Top/Streams';
import { colors } from '@app/styles';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import Config from '../config';

import TabNavigator, { TabParamList } from './TabNavigator';
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
  Tabs: NavigatorScreenParams<TabParamList>;
  // Stream: NavigatorScreenParams<StreamStackParamList>;

  // streams
  LiveStream: { id: string };
  StreamerProfile: { id: string };
  Categories: undefined;

  // Top
  TopStreams: undefined;
  Topcategories: undefined;
};

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const { exitRoutes } = Config;

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  StackScreenProps<AppStackParamList, T>;

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  const { auth } = useAuthContext();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
      }}
      initialRouteName="Tabs"
    >
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} options={{}} />
      {/* <Stack.Screen name="Stream" component={StreamStackNavigator} /> */}

      {/* streams */}
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen name="StreamerProfile" component={StreamerProfileScreen} />

      {/* categories */}
      <Stack.Screen name="Categories" component={CategoriesSecreen} />

      {/* top */}
      <Stack.Screen name="TopStreams" component={TopStreamsScreen} />
      <Stack.Screen name="TopCategories" component={CategoriesSecreen} />
    </Stack.Navigator>
  );
};

type NavigationProps = Partial<
  React.ComponentProps<typeof NavigationContainer>
>;

export const AppNavigator = (props: NavigationProps) => {
  const colorScheme = useColorScheme();

  useBackButtonHandler(routeName => exitRoutes.includes(routeName));

  const navTheme = useMemo(() => {
    const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...theme,
      colors: {
        ...theme.colors,
        background: colors.background,
      },
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorScheme]);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} {...props}>
      <AuthContextProvider>
        <AppStack />
      </AuthContextProvider>
    </NavigationContainer>
  );
};
