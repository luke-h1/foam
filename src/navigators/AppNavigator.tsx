/**
 * The app navigator is used for the primary navigation flows of your app.
 * Usually this will contain an auth flow (registration, login etc.)
 * and a "main" flow which the user will use once logged in
 */
import AuthLoadingScreen from '@app/screens/AuthLoadingScreen';
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
      initialRouteName="AuthLoading"
    >
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />

      <Stack.Screen name="Tabs" component={TabNavigator} />
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
      <AppStack />
    </NavigationContainer>
  );
};
