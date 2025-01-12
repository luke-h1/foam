import {
  AuthContextProvider,
  AuthContextTestProvider,
} from '@app/context/AuthContext';
import { initalTestAuthContextProps } from '@app/context/AuthContext.test';
import AuthLoadingScreen from '@app/screens/Auth/AuthLoading';
import LoginScreen from '@app/screens/Auth/LoginScreen';
import CategoryScreen from '@app/screens/Category/CategoryScreen';
import ChangelogScreen from '@app/screens/ChangelogScreen';
import { store } from '@app/store';
import { colors } from '@app/styles';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { PropsWithChildren, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import Config from '../config';

import StreamStackNavigator, {
  StreamStackParamList,
} from './StreamStackNavigator';
import TabNavigator, { TabParamList } from './TabNavigator';
import TopStackNavigator, { TopStackParamList } from './TopStackNavigator';
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
      }}
      initialRouteName="Tabs"
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
    </Stack.Navigator>
  );
};

type NavigationProps = Partial<
  React.ComponentProps<typeof NavigationContainer>
>;

const AuthContextComponent = ({ children }: PropsWithChildren) => {
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    return (
      <AuthContextTestProvider {...initalTestAuthContextProps}>
        {children}
      </AuthContextTestProvider>
    );
  }

  return <AuthContextProvider>{children}</AuthContextProvider>;
};

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
      <AuthContextComponent>
        <Provider store={store}>
          <AppStack />
        </Provider>
      </AuthContextComponent>
    </NavigationContainer>
  );
};
